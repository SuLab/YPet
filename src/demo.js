var SingleLink = Backbone.Marionette.ItemView.extend({
  tagName: 'li',
  className: 'list-group-item',
  template: _.template('<p class="text-center annotation-type"><%-name%></p>'),
  onRender: function() {
    this.$el.css({'backgroundColor': this.model.get('color')});
  }
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

  template: _.template('<div class="row"><div class="col-xs-9"><p class="annotation-text"><%-text%></p></div><div class="col-xs-3"><p class="text-center annotation-type"><%-type%></p></div></div>'),
  initialize : function(options) {
    this.listenTo(this.model, 'change:type', this.render);
  }
});

var ListAnnotationView = Backbone.Marionette.CollectionView.extend({
  tagName: 'ul',
  childView: SingleAnnotation
});


/*
 * Init
 */
YPet = new Backbone.Marionette.Application();

YPet.addInitializer(function(options) {
  var $text = $('p.paragraph');
  p = new Paragraph({'text': $text.html()});
  p.parseText();
  $text.remove();

  YPet.AnnotationTypes = new AnnotationTypeList([
    {name: 'Person', color: '#A4DEAB'},
    {name: 'Place', color: '#DCDDD8'},
    {name: 'Thing', color: '#E64C66'}
  ]);

  (new ListView({
    collection: YPet.AnnotationTypes,
    el: '.annotation-type-list'
  })).render();

  (new ListAnnotationView({
    collection: p.get('annotations'),
    el: '.annotation-list'
  })).render();


  /* Assign View to Region */
  YPet.addRegions({
    text: '#target',
  });
  var view = new WordCollectionView({collection: p.get('words')});
  YPet.text.show( view );
});

YPet.start();
