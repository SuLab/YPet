# YPet

[YPet](https://github.com/SuLab/YPet) is a Javascript library built in [Marionette.js](http://marionettejs.com/) to rapidly annotate paragraphs of text on websites. The project aims to rethink HTML text annotation, primarily focused on biocuration and adheres to the following rules:

* Limit the possibility for damaged annotations, individual letters are not desired.
* Allow rapid span highlighting to prevent broken single-word annotations.
* Don't enforce any DOM requirements, allow native functionality on any paragraph tag to respect page resizing or CSS styles.
* Allow rapid classification of annotation types without right mouse clicks.

for the goal of <strong>making the annotation process as fast and simple as possible</strong>. An [online demo](http://sulab.org/demos/YPet/) is available to play with.

Example of behavior:

![YPet Demo](http://www.puff.me.uk/scripps/ypet-demo-gil-scott-heron.gif "YPet Demo")



## How to Use

### Setup

```javascript
YPet.addInitializer(function(options) {
  /* Setup the paragraphs with a string to tokenize */
  var p1 = new Paragraph({'text': $('p#some-paragraph').html()});
  var p2 = new Paragraph({'text': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam tincidunt tempus lorem, quis sollicitudin lectus pretium nec. Ut non enim.'});

  /* Configure the # and colors of Annotation types (minimum 1 required) */
  YPet.AnnotationTypes = new AnnotationTypeList([
    {name: 'Person', color: '#A4DEAB'},
    {name: 'Place', color: 'PowderBlue'},
    {name: 'Thing', color: 'rgb(0, 180, 200)'}
  ]);

  /* Assign views to Region */
  YPet.addRegions({
    'p1': '#container-to-place-p1',
    'p2': '#container-to-place-p2'
  });

  /* Put the new Annotation views on the page */
  YPet['p1'].show( new WordCollectionView({collection: p1.get('words')}) );
  YPet['p2'].show( new WordCollectionView({collection: p2.get('words')}) );
});

YPet.start();

```

### Events

If you want to live track annotations as they're put on the paragraph (to save, send to a server, or do something else with) the following callbacks and serialization methods are available.

Each annotation is returned as an object with a `start` and `text` attribute, as well as an array of children words.


```javascript
YPet['p1'].currentView.collection.parentDocument.get('annotations').on('add', function(model, collection) {
  console.log('Add:', model.toJSON(), collection.toJSON());
});

YPet['p1'].currentView.collection.parentDocument.get('annotations').on('remove', function(model, collection) {
  console.log('Remove:', model.toJSON(), collection.toJSON());
});

YPet['p1'].currentView.collection.parentDocument.get('annotations').on('change', function(model) {
  console.log('Change:', model.toJSON());
});
```

## About

[YPet](https://github.com/SuLab/YPet) was developed to rapidly annotate bio-medical literature for [Mark2Cure](http://mark2cure.org) at [The Su Lab](http://sulab.org/) by [Max Nanis](http://twitter.com/x0xMaximus).


![The Scripps Research Institute](http://www.scripps.edu/files/images/logo120.png "The Scripps Research Institute")


[YPet](https://github.com/SuLab/YPet) is [distributed under the MIT License](https://github.com/SuLab/YPet/blob/master/LICENSE).


## Roadmap

If you'd like to support please fork and contribute. We're particularly looking forward on the following topics:

* Allow support for phrase tags: `<strong>`, `<em>`, `<code>`, et cetera…
* Lessen dependency requirements
* Improve setup process (reduce steps required) for parties wanting to leverage [YPet](https://github.com/SuLab/YPet)
* Continue to study user behavior to improve confusion that may lead to frustration
* Continue to improve performance to increase speed and prevent lagging
* JSLint pride
