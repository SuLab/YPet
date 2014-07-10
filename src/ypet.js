//
//-- Models & Collections
//

Word = Backbone.RelationalModel.extend({
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
  model: Word,
  url: '/api/v1/words',

  clear: function(attr) {
    return this.each(function(word) { word.set(attr, false); });
  },

  getBetweenRange: function(start, stop) {
    return this.filter(function(word){
      return word.get('start') >= start && word.get('start') <= stop;
    });
  }
});

Annotation = Backbone.RelationalModel.extend({
  defaults: {
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
    return this.get('words').pluck('text').join(' ');
  },

  toggleType : function() {
    this.get('words').each(function(word) { word.trigger('highlight'); });

    if( this.get('type') == YPet.AnnotationTypes.length-1 ) {
      this.destroy();
    } else {
      this.set('type', this.get('type')+1 );
    }

  }
});

AnnotationTypeList = Backbone.Collection.extend({
  model: Backbone.Model.extend({}),
  url: function() { return false; }
});

AnnotationList = Backbone.Collection.extend({
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

//
//-- Views
//
WordView = Backbone.Marionette.ItemView.extend({
  template: '#word-template',
  tagName: 'span',

  events : {
    'mousedown' : 'mousedownStart',
    'mouseover' : 'mousehoverStart',
    'mouseup'   : 'mouseupRelease',
  },

  initialize : function(options) {
    this.listenTo(this.model, 'change:selected', this.render);
    this.listenTo(this.model, 'change:neighbor', this.render);
    this.listenTo(this.model, 'highlight', function() {
      var index = this.model.get('parentAnnotation').get('type')+1;

      if(index == YPet.AnnotationTypes.length) {
        this.$el.css({'backgroundColor': 'white'});
      } else {
        var color = YPet.AnnotationTypes.at( index ).get('color');
        this.$el.css({'backgroundColor': color});
      }

    });
    options['firefox'] = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  },

  onRender : function() {
    this.renderingClassSetting('selected');
    this.renderingClassSetting('neighbor');
  },

  mousedownStart : function() {
    this.model.collection.clear('latest');
    this.model.set({'latest': true, 'selected': true});
  },

  mousehoverStart : function(evt) {
    var dragging = this.options.firefox ? 0 : evt.which;
    //-- If you're dragging with the mouse down to make a large selection
    if( dragging ) {
      var last_model = this.model.collection.findWhere({latest: true}),
          sel = [last_model.get('start'), this.model.get('start')],
          range = [_.min(sel), _.max(sel)];
      this.selectWordsOfAnnotations();
      _.each(this.model.collection.getBetweenRange(range[0], range[1]+1), function(word) { word.set('selected', true); });
    }
  },

  mouseupRelease : function(evt) {
    var self = this,
        last_model = this.model.collection.findWhere({latest: true});

    if( last_model != this.model ) {
      //-- If the user just finished making a drag selection
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

      self.createAnnotation(start_i, stop_i)
    } else {
      //-- If the single annotation or range started on a prexisting annotation
      if ( self.model.get('parentAnnotation') ) {
          self.model.get('parentAnnotation').toggleType()
      } else {
        //-- If the single annotation or range started on a prexisting annotation
        self.createAnnotation(self.model.get('start'), self.model.get('stop')+1);
      }
    }

    this.selectWordsOfAnnotations();
    this.selectNeighborsOfAnnotations();
  },

  createAnnotation : function(start, stop) {
    this.model.get('parentDocument').get('annotations').create({
      kind : 0,
      words: this.model.collection.getBetweenRange(start, stop)
    });
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
    this.model.collection.clear('selected');

    this.model.get('parentDocument').get('annotations').each(function(annotation) {
      annotation.get('words').each(function(word) { word.set('selected', true); });
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

var SingleLink = Backbone.Marionette.ItemView.extend({
  tagName: 'li',
  className: 'list-group-item',
  template: _.template('<div class="swatch" style="background-color:<%-color%>"></div> <%-name%>')
});

var ListView = Backbone.Marionette.CollectionView.extend({
  tagName: 'ul',
  childView: SingleLink
});

var SingleAnnotation = Backbone.Marionette.ItemView.extend({
  tagName: 'li',
  className: 'list-group-item',
  templateHelpers: function(a) {
    return {'text': this.model.getText(),
            'type': YPet.AnnotationTypes.at( this.model.get('type') ).get('name') }
  },

  template: _.template('<%-text%> <span class="badge"><%-type%></span>'),
  initialize : function(options) {
    this.listenTo(this.model, 'change:type', this.render);
  }
});

var ListAnnotationView = Backbone.Marionette.CollectionView.extend({
  tagName: 'ul',
  childView: SingleAnnotation
});


//
//-- Init
//
YPet = new Backbone.Marionette.Application();

YPet.addInitializer(function(options) {
  p = new Paragraph({'text': $('p.paragraph').html()});
  p.parseText();

  YPet.AnnotationTypes = new AnnotationTypeList([
    {name: 'Disease', color: '#00ccff'},
    {name: 'Gene', color: '#22A301'},
    {name: 'Protein', color: 'yellow'}
  ]);

  (new ListView({
    collection: YPet.AnnotationTypes,
    el: '.annotation-type-list'
  })).render();


  (new ListAnnotationView({
    collection: p.get('annotations'),
    el: '.annotation-list'
  })).render();


  //Assign View to Region
  YPet.addRegions({
    text: '.paragraph',
  });
  var view = new WordCollectionView({collection: p.get('words')});
  YPet.text.show( view );
});

YPet.start();
