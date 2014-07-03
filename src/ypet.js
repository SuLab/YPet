//
//-- Models & Collections
//

Word = Backbone.RelationalModel.extend({
  defaults: {
    text      : '',
    length    : null,
    start     : null,
    stop      : null,
    latest    : false,
    selected  : false,
    neighbor  : false,
  }
});

Annotation = Backbone.RelationalModel.extend({
  defaults: {
    text    : '',
    length  : null,
    start   : null,
    stop    : null,
  },

  sync    : function () { return false; }
});

WordList = Backbone.Collection.extend({
  model   : Word,
  url     : '/api/v1/words',

  clear : function(attr) {
    return this.each(function(word) { word.set(attr, false); });
  },

  selectBetweenRange : function(start, stop) {
    return this.filter(function(word){
      return word.get('start') >= start && word.get('start') <= stop;
    });
  }
});

AnnotationList = Backbone.Collection.extend({
  model   : Annotation,
  url     : '/api/v1/annotations',

  getRange : function() {
    //-- Returns back the indexes of the text which are part of a annotation
    var range = []
    this.each(function(annotation) { range.push( _.range(annotation.get('start'), annotation.get('stop')+1)  ); })
    return _.uniq( _.flatten(range) );
  },

  findContaining : function(index) {
    return this.filter(function(annotation) {
      return index >= annotation.get('start') && index <= annotation.get('stop');
    });
  },

  exactMatch : function(word) {
    return this.filter(function(annotation) {
      return  word.get('start') == annotation.get('start') &&
              word.get('stop') == annotation.get('stop');
    });
  },

  add : function(ann) {
    //-- Prevent duplicate annotations from being submitted
    var isDupe = this.any(function(_ann) {
        return _ann.get('text') === ann.get('text') && _ann.get('start') === ann.get('start');
    });
    if (isDupe) { return false; }
    Backbone.Collection.prototype.add.call(this, ann);
  }
});

Paragraph = Backbone.RelationalModel.extend({
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

  parseText : function() {
    var self = this,
        step = 0,
        length = 0,
        words = _.map( self.get('text').split(/\s+/) , function(word) {
          length = word.length;
          step = step + length + 1;
          return {
            'text'      : word,
            'length'    : length,
            'start'     : step - length - 1,
            'stop'      : step - 2
          }
        });

      _.each(self.get('words'), function(word) {
        word.destroy();
      });
      self.get('words').add(words);
  },

  mapAnnotationsForComparision : function(arr) {
    return _.map(arr, function(model) {
      return {'text'  : model.text,
              'start' : model.start}
        })
  },
});

//
//-- Views
//
WordView = Backbone.Marionette.ItemView.extend({
  template : '#word-template',
  tagName : "span",

  events : {
    'mousedown'   : 'clickOrInitDrag',
    'mouseup'     : 'releaseDrag',
    'mouseover'   : 'hover',
  },

  initialize : function(options) {
    this.listenTo(this.model, 'change:selected', this.render);
    this.listenTo(this.model, 'change:neighbor', this.render);
    options['auto_select_all'] = true;
    options['firefox'] = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
  },

  onRender : function() {
    this.renderingClassSetting('selected');
    this.renderingClassSetting('neighbor');
  },

  //
  //-- Event actions
  //
  hover : function(evt) {
    var dragging = this.options.firefox ? 0 : evt.which;
    //-- If you're dragging with the mouse down to make a large selection
    if( dragging ) {
      var last_model = this.model.collection.findWhere({latest: true}),
          sel = [last_model.get('start'), this.model.get('start')],
          range = [_.min(sel), _.max(sel)],
          highlight_list = this.model.collection.selectBetweenRange(range[0], range[1]+1);
      this.selectWordsOfAnnotations();
      _.each(highlight_list, function(word) { word.set('selected', true); });
    }
  },

  clickOrInitDrag : function() {
    //-- onmousedown we just set the word to be the latest so that we can refernce it later
    //-- whent he user releases after staying put or moving around
    this.model.collection.clear('latest');
    this.model.set({'latest': true, 'selected': true});
  },

  releaseDrag : function(evt) {
    //-- onmouseup from the user
    var self = this,
        last_model = this.model.collection.findWhere({latest: true}),
        annotations = this.model.get('parentDocument').get('annotations'),
        ann_range =  annotations.getRange();

    if( last_model != this.model ) {
      //
      //-- If the user just finished making a drag selection
      //
      var sel = [last_model.get('start'), this.model.get('stop')],
          range = [_.min(sel), _.max(sel)],
          start_i = range[0],
          stop_i = range[1]+1;

      //-- (TODO) http://stackoverflow.com/questions/7837456/comparing-two-arrays-in-javascript
      if( String(sel) !== String(range) ) {
        //-- They dragged in reverse
        start_i = this.model.get('start');
        stop_i = last_model.get('stop')+1;
      }

      self.createAnns(start_i, stop_i)
    } else {
      //
      //-- If it was a single click
      //
      if( _.contains(ann_range, this.model.get('start')) ) {
        //-- If the single annotation or range started on a prexisting annotation
        _.each(annotations.findContaining( this.model.get('start') ), function(ann) { ann.destroy(); })
      } else {
        //-- If the single annotation or range started on a prexisting annotation
        self.createAnns(self.model.get('start'), self.model.get('stop')+1);
      }
    }

    this.selectWordsOfAnnotations();
    this.selectNeighborsOfAnnotations();

    // console.log('/ / / / / / / / / / / /');
    // _.each(annotations.models, function(ann) {
      // console.log(ann.get('text'), " || ", ann.get('start'), ann.get('length'), ann.get('stop'));
    // });
  },

  createAnns : function(start, stop) {
    var self = this,
        doc = this.model.get('parentDocument'),
        annotations = doc.get('annotations'),
        text = doc.get('text').substring(start, stop);

    if(this.options.auto_select_all) {
      //-- Get the "pure" text
      text = this.clean(text);
      _.each(this.getIndicesOf(text, doc.get('text'), false), function(v) {
        annotations.create({
          text      : text,
          length    : text.length,
          start     : v,
          stop      : v + text.length
        });
      });
    } else {
      annotations.create({
        kind      : 0,
        text      : text,
        length    : text.length,
        start     : start,
        stop      : stop
      });
    }
  },

  //-- Utilities for view
  getIndicesOf : function(needle, haystack, caseSensitive) {
    var startIndex = 0,
        needleLen = needle.length,
        index,
        indices = [];

    if (!caseSensitive) {
        haystack = haystack.toLowerCase();
        needle = needle.toLowerCase();
    }

    while ((index = haystack.indexOf(needle, startIndex)) > -1) {
        if(this.clean( haystack.substring(index - 1, index + needleLen + 1) ) === needle) { indices.push(index); }
        startIndex = index + needleLen;
    }
    return indices;
  },

  clean : function(text) {
    return text.replace(/^[^a-z\d]*|[^a-z\d]*$/gi, '');
  },

  selectWordsOfAnnotations : function() {
    var self = this,
        offset = 0,
        clean_word;
    var ann_range =  this.model.get('parentDocument').get('annotations').map(function(m) {
        return { 'start' : m.get('start'), 'stop' : m.get('stop') }
      });

    //-- Iterate over the words and see if they are contained within any of the documents annotations
    this.model.collection.clear('selected');
    this.model.collection.each(function(word) {
      // (TODO) Cache this!
      clean_word = self.clean( word.get('text') );
      //-- Get the offset so we know that finding the annotation in the word will work!
      if(word.get('text') !== clean_word) { offset = word.get('text').indexOf(clean_word); }

      //- If the word is within annotation
      var found = _.filter(ann_range, function(ann) { return  word.get('start')+offset >= ann.start && word.get('stop') <= ann.stop; });
      // console.log('Found :: ', found, ' :: ', word.attributes);
      if( found.length ) { word.set('selected', true); }
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
});

//
//-- Init
//
YPet = new Backbone.Marionette.Application();

YPet.addInitializer(function(options) {
  p = new Paragraph({'text': $('p').html()});
  p.parseText();

  console.log(p);

  //Assign View to Region
  YPet.addRegions({
    text: ".paragraph",
  });
  var view = new WordCollectionView({collection: p.get('words')});
  YPet.text.show( view );
});

YPet.start();
