/*
 *  Models & Collections
 */

Word = Backbone.RelationalModel.extend({
  /* A Word model repersents each tokenized word present
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
    type: 0,
    cache_text: '',
  },

  sync: function () { return false; },

  relations: [{
    type: 'HasMany',
    key: 'words',

    relatedModel: Word,
    collectionType: WordList,

    reverseRelation : {
      key: 'parentAnnotation',
      includeInJSON: false,
    }
  }],

  getText : function() {
    /* Retrieves back the full text of the Annotation
     * based on the words that compose the Annotation. */
    var words = this.get('words');
    if(words.length) {
      return words.pluck('text').join(' ');
    } else {
      return this.get('cache_text');
    }
  },

  getStart : function() {
    var words = this.get('words');
    if(words.length) {
      return words.first().get('start');
    } else {
      return false;
    }
  },

  toggleType : function() {
    /* Removes (if only 1 Annotation type) or changes
     * the Annotation type when clicked after existing */
    if( this.get('type') == YPet.AnnotationTypes.length-1 ) {
      this.destroy();
    } else {
      this.set('type', this.get('type')+1 );
    }
  }
});

AnnotationTypeList = Backbone.Collection.extend({
  /* Very simple collection to store the type of
   * Annotations that the application allows
   * for paragraphs */
  model: Backbone.Model.extend({}),
  url: function() { return false; }
});

AnnotationList = Backbone.Collection.extend({
  /* Utils for the Paragraph Annotations lists
   * collectively */
  model: Annotation,
  url: '/api/v1/annotations',

  initialize : function(options) {
    this.listenTo(this, 'add', function(annotation) {
      annotation.set('cache_text', annotation.getText());
      this.drawAnnotations(annotation);
    });

    this.listenTo(this, 'change:type', function(annotation) {
      this.drawAnnotations(annotation);
    });

    this.listenTo(this, 'remove', function(annotation) {
      annotation.collection.parentDocument.get('words').each(function(word) {
        word.trigger('highlight', {'color': '#fff'});
        word.set('neighbor', false);
      });

      var self = this;
      annotation.collection.parentDocument.get('annotations').each(function(annotation) {
        self.drawAnnotations(annotation);
      });

    });
  },

  drawAnnotations: function(annotation) {
    annotation.get('words').each(function(word, word_index) {
      var annotation_type = YPet.AnnotationTypes.at(annotation.get('type'));
      word.trigger('highlight', {'color': annotation_type.get('color')});

      if(word_index == annotation.get('words').length-1) {
        word.set('neighbor', true);
      }

    });

  },

  add : function(ann) {
    if (ann.get('words').length==0) { return false; }
    Backbone.Collection.prototype.add.call(this, ann);
  }

});

Paragraph = Backbone.RelationalModel.extend({
  /* Foundational model for tracking everything going
   * on within a Paragraph like Words and Annotations */
  defaults: {
    text : '',
  },

  relations: [{
    type: 'HasMany',
    key: 'annotations',

    relatedModel: Annotation,
    collectionType: AnnotationList,

    reverseRelation : {
      key : 'parentDocument',
      includeInJSON: true,
    }
  }, {
    type: 'HasMany',
    key: 'words',

    relatedModel: Word,
    collectionType: WordList,

    reverseRelation : {
      key : 'parentDocument',
      includeInJSON: false,
    }
  }],

  /* Required step after attaching YPet to a <p> to
   * extract the individual words */
  parseText : function() {
    var self = this,
        step = 0,
        length = 0,
        words = _.map( self.get('text').split(/\s+/) , function(word) {
          length = word.length;
          step = step + length + 1;
          return {
            'text': word,
            'start': step - length - 1,
          }
        });

      _.each(self.get('words'), function(word) {
        word.destroy();
      });
      self.get('words').add(words);
  },
});

/*
 * Views
 */
WordView = Backbone.Marionette.ItemView.extend({
  template: _.template('<% if(neighbor) { %><%= text %><% } else { %><%= text %> <% } %>'),
  tagName: 'span',

  /* These events are only triggered when over
   * a span in the paragraph */
  events : {
    'mousedown' : 'mousedown',
    'mouseover' : 'mousehover',
    'mouseup'   : 'mouseup',
  },

  /* Setup even listeners for word spans */
  initialize : function(options) {
    this.listenTo(this.model, 'change:neighbor', this.render);
    this.listenTo(this.model, 'change:latest', function(model, value, options) {
      if(this.model.get('latest')) {
        this.model.trigger('highlight', {'color': '#7FE5FF'});
      }
      if(options.force) { this.model.trigger('highlight', {'color': '#fff'}); }
    });
    this.listenTo(this.model, 'highlight', function(options) {
      this.$el.css({'backgroundColor': options.color});
    });
 },

  /* Triggers the proper class assignment
   * when the word <span> is redrawn */
  onRender : function() {
    this.renderingClassSetting('neighbor');
  },

  /* When clicking down, make sure to keep track
   * that that word has been the latest interacted
   * element */
  mousedown : function() {
    this.model.set({'latest': 1});
  },

  mousehover : function(evt) {
    var word = this.model,
        words = word.collection;

    /* You're dragging if another word has a latest timestamp */
    if(_.compact(words.pluck('latest')).length) {
      if(word.get('latest') == null) { word.set({'latest': Date.now()}); }

      /* If the hover doesn't proceed in ordered fashion
       * we need to "fill in the blanks" between the words */
      var current_word_idx = words.indexOf(word);
      /* (TODO) Cache this */
      var first_word_idx = words.indexOf( words.find(function(word) { return word.get('latest') == 1; }) );

      /* Select everything from the starting to the end without
       * updating the timestamp on the first_word */
      var starting_positions = first_word_idx <= current_word_idx ? [first_word_idx, current_word_idx+1] : [first_word_idx+1, current_word_idx];
      var selection_indexes = _.range(_.min(starting_positions), _.max(starting_positions));
      _.each(_.without(selection_indexes, first_word_idx), function(idx) { words.at(idx).set('latest', Date.now()); });

      /* If there are extra word selections up or downstream
       * from the current selection, remove those */
      var last_selection_indexes = _.map(words.reject(function(word) { return word.get('latest') == null; }), function(word) { return words.indexOf(word); });
      var remove_indexes = _.difference(last_selection_indexes, selection_indexes);
      _.each(remove_indexes, function(idx) { words.at(idx).set('latest', null, {'force': true}); });

    }
  },

  mouseup : function(evt) {
    evt.stopPropagation();
    var word = this.model,
        words = word.collection;

    var selected = words.filter(function(word) { return word.get('latest') });
    if(selected.length == 1 && word.get('parentAnnotation') ) {
      word.get('parentAnnotation').toggleType();
    } else {
      /* if selection includes an annotation, delete that one */
      _.each(selected, function(word) {
        if(word.get('parentAnnotation')) {
          word.get('parentAnnotation').destroy();
        }
      })
      word.get('parentDocument').get('annotations').create({kind: 0, words: selected});
    };

    words.each(function(word) { word.set('latest', null); });
  },

  /* Adds the actual class to the element (can't
   * do in the template) so must manually add */
  renderingClassSetting : function(attrCheck) {
    if( this.model.get(attrCheck) ) {
      this.$el.addClass(attrCheck);
    } else {
      this.$el.removeClass(attrCheck);
    }
  }

});

WordCollectionView = Backbone.Marionette.CollectionView.extend({
  childView  : WordView,
  tagName   : 'p',
  className : 'paragraph',
  events : {
    'mouseup': 'captureAnnotation',
    'mouseleave': 'captureAnnotation',
  },

  captureAnnotation: function(evt) {
    var selection = this.collection.filter(function(word) { return word.get('latest') != null; });
    if(selection.length) {
      /* Doesn't actually matter which one */
      var model = selection[0];
      this.children.find(function(view, idx) { return model.get('start') == view.model.get('start'); }).$el.trigger('mouseup');
    }
  }
});
