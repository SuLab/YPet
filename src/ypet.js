/*
 *  Models & Collections
 */

Word = Backbone.RelationalModel.extend({
  /* A Word model repersents each tokenized word present
   * in the paragraph YPet is attached to. */

  defaults: {
    text: '',
    length: null,
    start: null,
    stop: null,
    latest: false,
    selected: false,
    neighbor: false,
  }
});

WordList = Backbone.Collection.extend({
  /* Common utils to perform on an array of Word
   * models for house keeping and search */

  model: Word,
  url: '/api/v1/words',

  clear: function(attr) {
    return this.each(function(word) { word.set(attr, false); });
  },
  
  whitewash: function() {
    return this.each(function(word) { word.trigger('white'); });
  },

  getBetweenRange: function(start, stop) {
    return this.filter(function(word){
      return word.get('start') >= start && word.get('start') <= stop;
    });
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
    type: 0,
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
    return this.get('words').pluck('text').join(' ');
  },

  toggleType : function() {
    /* Removes (if only 1 Annotation type) or changes
     * the Annotation type when clicked after existing */
    if( this.get('type') == YPet.AnnotationTypes.length-1 ) {
      this.destroy();
    } else {
      this.set('type', this.get('type')+1 );
    }
    this.get('words').each(function(word) { word.trigger('highlight'); });
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

  exactMatch : function(word) {
    return this.filter(function(annotation) {
      return  word.get('start') == annotation.get('words').first().get('start') &&
              word.get('text') == annotation.getText();
    });
  },

  add : function(ann) {
    //-- Prevent duplicate annotations from being submitted
    var isDupe = this.any(function(_ann) {
        return _ann.getText() === ann.getText() && _ann.get('words').first().get('start') === ann.get('words').first().get('start');
    });
    //if ( this.get('words').length == 0 ) { return false; }
    if (isDupe) { return false; }
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
            'length': length,
            'start': step - length - 1,
            'stop': step - 2
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

  /* Setup even listeners for word spans
   * 1. When the selected class is togged
   * 2. When the neighbor flag changed (add trailing space)
   * 3. When needing to highlight */
  initialize : function(options) {
    this.listenTo(this.model, 'change:selected', this.render);
    this.listenTo(this.model, 'change:neighbor', this.render);
    this.listenTo(this.model, 'white', function() { this.$el.css({'backgroundColor': '#fff'}); });
    this.listenTo(this.model, 'highlight', function() {
      /* Figure out the current index of the annotation
      * and use that to toggle the color */
      var parent_annotation = this.model.get('parentAnnotation');
      if(parent_annotation) {
        /* This word is part of an annotation */
        var annotation_type = YPet.AnnotationTypes.at(parent_annotation.get('type'));
        this.$el.css({'backgroundColor': annotation_type.get('color')});
      } else {
        /* This occurs during dragging */
        var annotation_type = YPet.AnnotationTypes.at(0);
        this.$el.css({'backgroundColor': annotation_type.get('color')});
      }

    });
    options['firefox'] = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  },

  /* Triggers the proper class assignment
   * when the word <span> is redrawn */
  onRender : function() {
    this.renderingClassSetting('selected');
    this.renderingClassSetting('neighbor');
  },

  /* When clicking down, make sure to keep track
   * that that word has been the latest interacted
   * element */
  mousedown : function() {
    this.model.collection.clear('latest');
    this.model.set({'latest': true, 'selected': true});
  },

  mousehover : function(evt) {
    var dragging = this.options.firefox ? 0 : evt.which;
    /* If you're dragging with the mouse down to make a large selection */
    if( dragging ) {
      var last_model = this.model.collection.findWhere({latest: true}),
          sel = [last_model.get('start'), this.model.get('start')],
          range = [_.min(sel), _.max(sel)];
      this.selectWordsOfAnnotations();
      /* Make sure all words from the start and where the mouse
       * is now is selected */
      _.each(this.model.collection.getBetweenRange(range[0], range[1]+1), function(word) { word.set('selected', true); word.trigger('highlight'); });
    }
  },

  mouseup : function(evt) {
    var self = this,
        word = self.model,
        last_model = word.collection.findWhere({latest: true});

    evt.stopPropagation();

    if( last_model != word ) {
      /* If the user just finished making a drag selection */
      var sel = [last_model.get('start'), word.get('stop')],
          range = [_.min(sel), _.max(sel)],
          start_i = range[0],
          stop_i = range[1]+1;

      /* (TODO) http://stackoverflow.com/questions/7837456/comparing-two-arrays-in-javascript */
      if( String(sel) !== String(range) ) {
        //-- They dragged in reverse
        start_i = word.get('start');
        stop_i = last_model.get('stop')+1;
      }

      self.createAnnotation(start_i, stop_i)
    } else {
      /* If the single annotation or range started
       * on a prexisting annotation
      *
      * parentAnnotation is blank on words that are not
      * part of an Annotation */
      var parent_annotation = word.get('parentAnnotation')
      if ( parent_annotation ) {
          self.$el.css({'backgroundColor': '#fff'});
          parent_annotation.toggleType()
      } else {
        /* If the single annotation or range started on a prexisting annotation */
        self.createAnnotation(word.get('start'), word.get('stop')+1);
      }
    }

    this.selectWordsOfAnnotations();
    this.selectNeighborsOfAnnotations();
  },

  createAnnotation : function(start, stop) {
    var word = this.model;
    word.get('parentDocument').get('annotations').create({
      kind : 0,
      words: word.collection.getBetweenRange(start, stop)
    });
    word.trigger('highlight');
  },

  /*
   * Utilities for view
   */
  selectWordsOfAnnotations : function() {
    this.model.collection.clear('selected');
    this.model.collection.whitewash();

    this.model.get('parentDocument').get('annotations').each(function(annotation) {
      annotation.get('words').each(function(word) { word.set('selected', true); word.trigger('highlight'); });
    });
  },

  selectNeighborsOfAnnotations : function() {
    this.model.collection.clear('neighbor');
    var anns = this.model.get('parentDocument').get('annotations');

    this.model.collection.each(function(word, word_idx) {
      //-- Is the person to your right selected?
      var left_neighbor = word.collection.at(   word_idx - 1),
          right_neighbor = word.collection.at(  word_idx + 1);

      if(right_neighbor && !right_neighbor.get('selected') && word.get('selected')) {
        word.set('neighbor', true);
      }

      if(anns.exactMatch(word).length > 0 && left_neighbor) {
        if(left_neighbor.get('selected')) {
          left_neighbor.set('neighbor', true);
        }
        word.set('neighbor', true);
      }

    });

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
    'mouseup' : function(evt) {
      var last_word = _.last(this.collection.where({'selected': true})); 
      if(last_word) {
        this.children.each(function(view, idx) {
          if(last_word.get('start') == view.model.get('start')) {
            view.$el.trigger('mouseup');
          };
        });
      }
      this.collection.clear('selected');

    },
  },

});
