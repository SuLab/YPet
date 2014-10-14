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


/*
 * Init
 */
YPet = new Backbone.Marionette.Application();

YPet.addInitializer(function(options) {
  p = new Paragraph({'text': $('p.paragraph').html()});
  p.parseText();

  YPet.AnnotationTypes = new AnnotationTypeList([
    {name: 'Disease', color: '#00ccff'},
    /*{name: 'Gene', color: '#22A301'},
    {name: 'Protein', color: 'yellow'}*/
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
    text: '.paragraph',
  });
  var view = new WordCollectionView({collection: p.get('words')});
  YPet.text.show( view );
});

YPet.start();
