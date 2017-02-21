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
    return {'type': YPet.AnnotationTypes.at( this.model.get('type') ).get('name') }
  },

  template: _.template('<div class="row"><div class="col-xs-8"><p class="annotation-text"><%-text%></p></div><div class="col-xs-1"><p><%-start%></p></div><div class="col-xs-3"><p class="text-center annotation-type"><%-type%></p></div></div>'),
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
YPet.addInitializer(function(options) {
  var p1 = new Paragraph({'text': $('p.paragraph').html()});

  YPet.AnnotationTypes = new AnnotationTypeList([
    {name: 'Person', color: '#A4DEAB'},
    {name: 'Place', color: 'PowderBlue'},
    {name: 'Thing', color: 'rgb(0, 180, 200)'}
  ]);

  (new ListView({
    collection: YPet.AnnotationTypes,
    el: '.annotation-type-list'
  })).render();

  (new ListAnnotationView({
    collection: p1.get('annotations'),
    el: '.annotation-list'
  })).render();


  /* Assign View to Region */
  YPet.addRegions({
    'p1': '#target',
  });

  YPet['p1'].show( new WordCollectionView({collection: p1.get('words')}) );
});

YPet.start();

