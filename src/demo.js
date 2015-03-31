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


/*
 * Init
 */
YPet.addInitializer(function(options) {

  /* data fetches the original document and annotations */
  $.getJSON('data/data.json', function( data ) {
    var passages = data.collection.document.passage;
    var regions = {};
    _.each(passages, function(passage, passage_idx) {
      regions[passage_idx] = '#'+passage.infon[2]['#text'];
    });
    YPet.addRegions(regions);

    _.each(passages, function(passage, passage_idx) {
      var p = new Paragraph({'text': passage.text});
      YPet[passage_idx].show( new WordCollectionView({
        collection: p.get('words'),
        passage_json: passage,
        bioc_json: data
      }) );
    });
  });

  /* partner fetches the same document and but with partner annotations */
  $.getJSON('data/partner.json', function( data ) {
    var passages = data.collection.document.passage;
    _.each(passages, function(passage, passage_idx) {
      YPet[passage_idx].currentView.drawBioC(passage, true);
    });
  });

  YPet.AnnotationTypes = new AnnotationTypeList([
    {name: 'Person', color: '#A4DEAB'},
    {name: 'Place', color: 'PowderBlue'},
    {name: 'Thing', color: 'rgb(0, 180, 200)'}
  ]);

  (new ListView({
    collection: YPet.AnnotationTypes,
    el: '.annotation-type-list'
  })).render();

});

YPet.start();
