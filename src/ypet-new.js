Date.now = Date.now || function () {
        return +new Date;
    };
(function (d) {
    d.each(["backgroundColor", "borderBottomColor", "borderLeftColor", "borderRightColor", "borderTopColor", "color", "outlineColor"], function (f, e) {
        d.fx.step[e] = function (g) {
            if (!g.colorInit) {
                g.start = c(g.elem, e);
                g.end = b(g.end);
                g.colorInit = true
            }
            g.elem.style[e] = "rgb(" + [Math.max(Math.min(parseInt((g.pos * (g.end[0] - g.start[0])) + g.start[0]), 255), 0), Math.max(Math.min(parseInt((g.pos * (g.end[1] - g.start[1])) + g.start[1]), 255), 0), Math.max(Math.min(parseInt((g.pos * (g.end[2] - g.start[2])) + g.start[2]), 255), 0)].join(",") + ")"
        }
    });

    function b(f) {
        var e;
        if (f && f.constructor == Array && f.length == 3) {
            return f
        }
        if (e = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(f)) {
            return [parseInt(e[1]), parseInt(e[2]), parseInt(e[3])]
        }
        if (e = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(f)) {
            return [parseFloat(e[1]) * 2.55, parseFloat(e[2]) * 2.55, parseFloat(e[3]) * 2.55]
        }
        if (e = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(f)) {
            return [parseInt(e[1], 16), parseInt(e[2], 16), parseInt(e[3], 16)]
        }
        if (e = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(f)) {
            return [parseInt(e[1] + e[1], 16), parseInt(e[2] + e[2], 16), parseInt(e[3] + e[3], 16)]
        }
        if (e = /rgba\(0, 0, 0, 0\)/.exec(f)) {
            return a.transparent
        }
        return a[d.trim(f).toLowerCase()]
    }

    function c(g, e) {
        var f;
        do {
            f = d.css(g, e);
            if (f != "" && f != "transparent" || d.nodeName(g, "body")) {
                break
            }
            e = "backgroundColor"
        } while (g = g.parentNode);
        return b(f)
    }

    var a = {
        aqua: [0, 255, 255],
        azure: [240, 255, 255],
        beige: [245, 245, 220],
        black: [0, 0, 0],
        blue: [0, 0, 255],
        brown: [165, 42, 42],
        cyan: [0, 255, 255],
        darkblue: [0, 0, 139],
        darkcyan: [0, 139, 139],
        darkgrey: [169, 169, 169],
        darkgreen: [0, 100, 0],
        darkkhaki: [189, 183, 107],
        darkmagenta: [139, 0, 139],
        darkolivegreen: [85, 107, 47],
        darkorange: [255, 140, 0],
        darkorchid: [153, 50, 204],
        darkred: [139, 0, 0],
        darksalmon: [233, 150, 122],
        darkviolet: [148, 0, 211],
        fuchsia: [255, 0, 255],
        gold: [255, 215, 0],
        green: [0, 128, 0],
        indigo: [75, 0, 130],
        khaki: [240, 230, 140],
        lightblue: [173, 216, 230],
        lightcyan: [224, 255, 255],
        lightgreen: [144, 238, 144],
        lightgrey: [211, 211, 211],
        lightpink: [255, 182, 193],
        lightyellow: [255, 255, 224],
        lime: [0, 255, 0],
        magenta: [255, 0, 255],
        maroon: [128, 0, 0],
        navy: [0, 0, 128],
        olive: [128, 128, 0],
        orange: [255, 165, 0],
        pink: [255, 192, 203],
        purple: [128, 0, 128],
        violet: [128, 0, 128],
        red: [255, 0, 0],
        silver: [192, 192, 192],
        white: [255, 255, 255],
        yellow: [255, 255, 0],
        transparent: [255, 255, 255]
    }
})(jQuery);

/*
 *  Models & Collections
 */
Word = Backbone.RelationalModel.extend({
    /* A Word model represents each tokenized word present
     * in the paragraph YPet is attached to. */
    defaults: {
        text: '',
        start: null,
        latest: null,
        neighbor: false,
    }
});

WordList = Backbone.Collection.extend({
    /* Common utils to perform on an array of Word
     * models for house keeping and search */
    model: Word,
    url: '/api/v1/words',

    clone: function (deep) {
        if (deep) {
            return new this.constructor(_.map(this.models, function (m) {
                return m.clone();
            }));
        } else {
            return Backbone.Collection.prototype.clone();
        }
    }

});

Annotation = Backbone.RelationalModel.extend({
    /* Each annotation in the paragraph. An Annotation
     * is composed of an array of Words in order to determine
     * the full text and position which are not
     * explicity set */
    defaults: {
        /* An annotation doesn't exist when removed so
         * we can start them all off at 0 and not need to
         * mix in a null type */
        type_id: 0,
        text: '',
        start: null,
    },

    sync: function () {
        return false;
    },

    relations: [{
        type: 'HasMany',
        key: 'words',

        relatedModel: Word,
        collectionType: WordList,

        reverseRelation: {
            key: 'parentAnnotation',
            includeInJSON: false,
        }
    }],

    toggleType: function () {
        /* Removes (if only 1 Annotation type) or changes
         * the Annotation type when clicked after existing */
        if (this.get('type_id') == YPet.AnnotationTypes.length - 1 || this.get('text') == "") {
            this.destroy();
        } else {
            this.set('type_id', this.get('type_id') + 1);
        }
    }
});

AnnotationTypeList = Backbone.Collection.extend({
    /* Very simple collection to store the type of
     * Annotations that the application allows
     * for paragraphs */
    model: Backbone.Model.extend({}),
    url: function () {
        return false;
    }
});

AnnotationList = Backbone.Collection.extend({
    /* Utils for the Paragraph Annotations lists
     * collectively */
    model: Annotation,
    url: '/api/v1/annotations',

    sanitizeAnnotation: function (full_str, start) {
        /* Return the cleaned string and the (potentially) new start position */
        var str = _.str.clean(full_str).replace(/^[^a-z\d]*|[^a-z\d]*$/gi, '');
        return {'text': str, 'start': start + full_str.indexOf(str)};
    },

    initialize: function (options) {
        this.listenTo(this, 'add', function (annotation) {
            var ann = this.sanitizeAnnotation(annotation.get('words').pluck('text').join(' '), annotation.get('words').first().get('start'));
            annotation.set('text', ann.text);
            annotation.set('start', ann.start);
            this.drawAnnotations(annotation);
        });

        this.listenTo(this, 'change:type_id', function (annotation) {
            this.drawAnnotations(annotation);
        });

        this.listenTo(this, 'remove', function (annotation, collection) {
            /* Must iterate b/c annotation var "words" attribute is
             * empty at this point */
            collection.parentDocument.get('words').each(function (word) {
                word.trigger('highlight', {'color': '#fff'});
                word.set('neighbor', false);
            });

            collection.each(function (annotation) {
                collection.drawAnnotations(annotation);
            });

        });
    },

    drawAnnotations: function (annotation) {
        var annotation_type = YPet.AnnotationTypes.at(annotation.get('type_id')),
            words_len = annotation.get('words').length;
        var parent_document = this.parentDocument || this._parentDocument;

        /* Collect Words
         annotation.get('start'), annotation.get('text').length
         */
        var selected = parent_document.get('words').filter(function (word) {
            return word.get('start') >= annotation.get('start') && word.get('start') < annotation.get('start') + annotation.get('text').length;
        });
        annotation.set('words', selected);

        /* Draw all the basic background or underlines */
        annotation.get('words').each(function (word, word_index) {
            if (annotation.get('opponent')) {
                word.trigger('underline', {'color': annotation_type.get('color')});
            } else {
                word.trigger('highlight', {'color': annotation_type.get('color')});
                if (word_index == words_len - 1) {
                    word.set('neighbor', true);
                }
            }
        });

        if (annotation.get('opponent')) {
            var words = annotation.get('words')
            var author_annotations = parent_document.get('annotations');

            var anns = []
            author_annotations.each(function (main_ann) {
                if (main_ann.get('words').contains(words.first()) || main_ann.get('words').contains(words.last())) {
                    anns.push(main_ann.cid);
                }
            });

            if (_.uniq(anns).length > 1) {
                /* 2 Different Parent Annotations */
                words.each(function (word) {
                    if (word == words.last()) {
                        word.trigger('underline-space', {'color': '#fff', 'last_word': true});
                    } else {
                        word.trigger('underline-space', {'color': annotation_type.get('color'), 'last_word': false});
                    }
                });
            }
        }

    },

    add: function (ann) {
        if (ann.get('words').length == 0) {
            return false;
        }
        Backbone.Collection.prototype.add.call(this, ann);
    }

});

Paragraph = Backbone.RelationalModel.extend({
    /* Foundational model for tracking everything going
     * on within a Paragraph like Words and Annotations */
    defaults: {
        text: '',
    },

    relations: [{
        type: 'HasMany',
        key: 'annotations',

        relatedModel: Annotation,
        collectionType: AnnotationList,

        reverseRelation: {
            key: 'parentDocument',
            includeInJSON: false,
        }
    }, {
        type: 'HasMany',
        key: 'opponent_annotations',

        relatedModel: Annotation,
        collectionType: AnnotationList,

        reverseRelation: {
            /* This needs a sep key as the same model above */
            key: '_parentDocument',
            includeInJSON: false,
        }
    }, {
        type: 'HasMany',
        key: 'words',

        relatedModel: Word,
        collectionType: WordList,

        reverseRelation: {
            key: 'parentDocument',
            includeInJSON: false,
        }
    }],

    /* Required step after attaching YPet to a <p> to
     * extract the individual words */
    initialize: function (options) {
        var step = 0,
            space_padding,
            word_obj,
            text = options.text,
            words = _.map(_.str.words(text), function (word) {
                word_obj = {
                    'text': word,
                    'start': step,
                }
                space_padding = (text.substring(step).match(/\s+/g) || [""])[0].length;
                step = step + word.length + space_padding;
                return word_obj;
            });

        this.get('words').each(function (word) {
            word.destroy();
        });
        this.get('words').add(words);
    },
});

/*
 * Views
 */
WordView = Backbone.Marionette.View.extend({
    template: _.template('<% if(neighbor) { %><%= text %><% } else { %><%= text %> <% } %>'),
    tagName: 'span',

    /* These events are only triggered when over
     * a span in the paragraph */
    events: {
        'mousedown': 'mousedown',
        'mouseover': 'mouseover',
        'mouseup': 'mouseup',
    },

    /* Setup event listeners for word spans */
    initialize: function (options) {
        this.listenTo(this.model, 'change:neighbor', this.render);
        this.listenTo(this.model, 'change:latest', function (model, value, options) {
            if (this.model.get('latest')) {
                this.model.trigger('highlight', {'color': '#D1F3FF'});
            }
            if (options.force) {
                this.model.trigger('highlight', {'color': '#fff'});
            }
        });
        this.listenTo(this.model, 'highlight', function (options) {
            this.$el.css({'backgroundColor': options.color});
        });

        this.listenTo(this.model, 'unclick', function (options) {
            var $el = this.$el;
            $el.animate({backgroundColor: '#fff'}, 750, function () {
                $el.trigger('mousedown').trigger('mouseup');
            });
        });

        this.listenTo(this.model, 'change:disabled', function (options) {
            if (this.model.get('disabled')) {
                this.$el.css('cursor', 'not-allowed');
            }
        });

        this.listenTo(this.model, 'change:masked', function (options) {
            if (this.model.get('masked')) {
                this.$el.css({'color': '#000', 'cursor': 'default', 'opacity': '.5'});
            }
        });

        this.listenTo(this.model, 'underline', function (options) {
            var $container = this.$el.parent(),
                pos = this.$el.position(),
                split_end = this.$el.height() >= 30;
            /* (TODO) Compare to reference single height unit */

            var yaxis = pos.top + this.$el.height() + 2;
            var width = this.$el.width() + 1;

            if (split_end) {
                /* The first part of the word that wraps to the second line */
                var absolute_left = $container.find('span').first().position().left;
                var split_left = $prev.position().left + $prev.width();
                var $prev = this.$el.prev(),
                    $next = this.$el.next();

                $container.append('<div class="underline" style=" \
          position: absolute; \
          height: 4px; \
          width: ' + (Math.abs(pos.left + width - split_left)) + 'px; \
          top: ' + (pos.top + (this.$el.height() / 2) - 5) + 'px; \
          left: ' + split_left + 'px; \
          background-color: ' + d3.rgb(options.color).darker(.5) + ';"></div>');

                /* The reminder on the line below */
                /* (TODO) sometimes it'll split and there will be no next word */
                $container.append('<div class="underline" style=" \
          position: absolute; \
          height: 4px; \
          width: ' + ($next.position().left - absolute_left) + 'px; \
          top: ' + yaxis + 'px; \
          left: ' + absolute_left + 'px; \
          background-color: ' + d3.rgb(options.color).darker(.5) + ';"></div>');

            } else {
                $container.append('<div class="underline" style=" \
          position: absolute; \
          height: 4px; \
          width: ' + width + 'px; \
          top: ' + yaxis + 'px; \
          left: ' + pos.left + 'px; \
          background-color: ' + d3.rgb(options.color).darker(.5) + ';"></div>');
            }
        });

        this.listenTo(this.model, 'underline-space', function (options) {
            var $container = this.$el.parent(),
                pos = this.$el.position(),
                color = d3.rgb(options.color).darker(2);

            var yaxis = pos.top + this.$el.height() + 2;
            var width = this.$el.width();
            if (options.last_word) {
                width = width - 5;
                color = '#fff';
            }

            $container.append('<div class="underline-space" style=" \
        position: absolute; \
        height: 4px; \
        width: 5px; \
        top: ' + yaxis + 'px; \
        left: ' + (pos.left + width) + 'px; \
        background-color: ' + color + ';"></div>');
        });

    },

    /* riggers the proper class assignment
     * when the word <span> is redrawn */
    onRender: function () {
        this.$el.css({'margin-right': this.model.get('neighbor') ? '5px' : '0px'});
    },

    /* When clicking down, make sure to keep track
     * that that word has been the latest interacted
     * element */
    mousedown: function (evt) {
        if (YPet['convoChannel']) {
            YPet['convoChannel'].trigger('mouse-down', evt);
        }
        evt.stopPropagation();
        if (this.model.get('disabled')) {
            return;
        }
        ;
        this.model.set({'latest': 1});
    },

    mouseover: function (evt) {
        evt.stopPropagation();
        if (this.model.get('disabled')) {
            this.$el.css({'color': '#000'});
            return;
        }
        ;
        var word = this.model,
            words = word.collection;

        /* You're dragging if another word has a latest timestamp */
        if (_.compact(words.pluck('latest')).length) {
            if (_.isNull(word.get('latest'))) {
                word.set({'latest': Date.now()});
            }

            /* If the hover doesn't proceed in ordered fashion
             * we need to "fill in the blanks" between the words */
            var current_word_idx = words.indexOf(word);
            var first_word_idx = words.indexOf(words.find(function (word) {
                return word.get('latest') == 1;
            }));

            /* Select everything from the starting to the end without
             * updating the timestamp on the first_word */
            var starting_positions = first_word_idx <= current_word_idx ? [first_word_idx, current_word_idx + 1] : [first_word_idx + 1, current_word_idx];
            var selection_indexes = _.range(_.min(starting_positions), _.max(starting_positions));
            _.each(_.without(selection_indexes, first_word_idx), function (idx) {
                words.at(idx).set('latest', Date.now());
            });

            /* If there are extra word selections up or downstream
             * from the current selection, remove those */
            var last_selection_indexes = _.map(words.reject(function (word) {
                return _.isNull(word.get('latest'));
            }), function (word) {
                return words.indexOf(word);
            });
            var remove_indexes = _.difference(last_selection_indexes, selection_indexes);

            var word,
                ann;
            _.each(remove_indexes, function (idx) {
                word = words.at(idx);
                word.set('latest', null, {'force': true});
                ann = word.get('parentAnnotation');
                if (ann) {
                    ann.collection.drawAnnotations(ann);
                }
            });

        }
    },

    mouseup: function (evt) {
        evt.stopPropagation();
        if (this.model.get('disabled')) {
            return;
        }
        ;
        var word = this.model,
            words = word.collection;

        var selected = words.filter(function (word) {
            return word.get('latest')
        });
        if (selected.length == 1 && word.get('parentAnnotation')) {
            word.get('parentAnnotation').toggleType();
        } else {
            /* if selection includes an annotation, delete that one */
            _.each(selected, function (w) {
                if (w.get('parentAnnotation')) {
                    w.get('parentAnnotation').destroy();
                }
            })
            word.get('parentDocument').get('annotations').create({words: selected});
        }
        ;

        words.each(function (word) {
            word.set('latest', null);
        });
    }

});

WordCollectionView = Backbone.Marionette.CollectionView.extend({
    childView: WordView,
    tagName: 'p',
    className: 'paragraph',
    events: {
        'mousedown': 'startCapture',
        'mousemove': 'startHoverCapture',
        'mouseup': 'captureAnnotation',
        'mouseleave': 'captureAnnotation',
    },

    onRender: function () {
        this.drawBioC(this.options.passage_json);
    },

    drawBioC: function (passage, opponent) {
        opponent = opponent || false
        var words = this.collection,
            parentDocument = words.parentDocument;

        if (opponent) {
            /* If you're showing a partner's results, disallow highlighting */
            this.$el.css({'color': '#000', 'cursor': 'default'});
            ;
            words.each(function (w) {
                w.set('disabled', true);
            });
            this.$el.css('cursor', 'not-allowed');
        }

        if (passage) {

            /*
             * Make selections if Annotations are present
             */
            var annotations = _.compact(_.flatten([passage.annotation]));
            var passage_offset = +passage.offset;
            if (annotations.length) {

                var user_ids = _.uniq(_.map(annotations, function (v) {
                    return _.find(v.infon, function (o) {
                        return o['@key'] == 'user_id';
                    })['#text'];
                }));
                if (user_ids.length != 1) {
                    console.log('throw error');
                }
                var user_id = +user_ids[0];
                if (passage_offset != 0) {
                    passage_offset++;
                }

                _.each(annotations, function (annotation, annotation_idx) {
                    try {
                        var ann_start = +annotation.location['@offset'] - passage_offset;
                        var ann_length = +annotation.location['@length'];
                        var ann_type_id = +_.find(annotation.infon, function (o) {
                            return o['@key'] == 'type_id';
                        })['#text'];

                        var start_match = false;
                        var selected = words.filter(function (word) {
                            /* The Annotation found a word which matches start position exactly */
                            var starts = word.get('start') == ann_start;
                            if (starts) {
                                start_match = true;
                            }
                            return starts || ( word.get('start') > ann_start && word.get('start') < ann_start + ann_length );
                        });

                        if (selected.length) {
                            if (opponent) {
                                var opp_anns = parentDocument.get('opponent_annotations');
                                opp_anns.create({words: selected, type_id: ann_type_id, opponent: opponent});
                            } else {
                                var anns = parentDocument.get('annotations');
                                anns.create({words: selected, type_id: ann_type_id, opponent: opponent});
                            }
                        }

                        var words_match = selected.length == _.str.words(annotation.text).length;
                        if (words_match == false && start_match == false) {
                            Raven.captureMessage('Imperfect Pubtator >> YPet Match', {
                                extra: {
                                    'selected': selected,
                                    'annotation': annotation,
                                    'passage': passage
                                }
                            });
                        }

                    } catch (e) {
                        Raven.captureException(e);
                    }

                });
            }
        }

    },

    outsideBox: function (evt) {
        var x = evt.pageX,
            y = evt.pageY;

        var obj;
        var spaces = _.compact(this.children.map(function (view) {
            obj = view.$el.offset();
            if (obj.top && obj.left) {
                obj.bottom = obj.top + view.$el.height();
                obj.right = obj.left + view.$el.width();
                return obj;
            }
        }));
        return (_.first(spaces).left > x || x > _.max(_.pluck(spaces, 'right'))) || (_.first(spaces).top > y || y > _.last(spaces).bottom);
    },

    leftBox: function (evt) {
        return evt.pageX <= this.children.first().$el.offset().left;
    },

    startCapture: function (evt) {
        if (YPet['convoChannel']) {
            YPet['convoChannel'].trigger('mouse-down', evt);
        }
        var closest_view = this.getClosestWord(evt);
        if (closest_view) {
            closest_view.$el.trigger('mousedown');
        }
    },

    timedHover: _.throttle(function (evt) {
        if (this.outsideBox(evt)) {
            var closest_view = this.getClosestWord(evt);
            if (closest_view) {
                closest_view.$el.trigger('mouseover');
            }
        }
    }, 100),

    startHoverCapture: function (evt) {
        this.timedHover(evt);
    },

    captureAnnotation: function (evt) {
        var selection = this.collection.reject(function (word) {
            return _.isNull(word.get('latest'));
        });
        if (selection.length) {
            /* Doesn't actually matter which one */
            var model = selection[0];
            this.children.find(function (view, idx) {
                return model.get('start') == view.model.get('start');
            }).$el.trigger('mouseup');
        }
    },

    getClosestWord: function (evt) {
        var x = evt.pageX,
            y = evt.pageY,
            closest_view = null,
            word_offset,
            dx, dy,
            distance, minDistance,
            left, top, right, bottom,
            leftBox = this.leftBox(evt);

        this.children.each(function (view, idx) {
            word_offset = view.$el.offset();
            left = word_offset.left;
            top = word_offset.top;
            right = left + view.$el.width();
            bottom = top + view.$el.height();

            if (leftBox) {
                dx = Math.abs(left - x);
            } else {
                dx = Math.abs((left + right) / 2 - x);
            }
            dy = Math.abs((top + bottom) / 2 - y);
            distance = Math.sqrt((dx * dx) + (dy * dy));

            if (minDistance === undefined || distance < minDistance) {
                minDistance = distance;
                closest_view = view;
            }

        });
        return closest_view;
    },

});


function initAnnotationTypes(Ypet) {
    Ypet.AnnotationTypes = new AnnotationTypeList([
        {name: 'Disease', color: '#d1f3ff'},
        {name: 'Gene', color: '#B1FFA8'},
        {name: 'Drug', color: '#ffd1dc'}
    ]);
};

