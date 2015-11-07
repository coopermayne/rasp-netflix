var casper = require("casper").create();

links = [];

function getLinks() {
  if(document.querySelectorAll('h3.r a')){
    var link = document.querySelectorAll('h3.r a')[0];
    return link.getAttribute('href');
  }
}

casper.start('http://google.com', function() {
    this.fill('form[action="/search"]', { q: casper.cli.get(0)}, true);
});

casper.then(function(){
  links = links.concat(this.evaluate(getLinks));
});

casper.run(function(){
  if(links.length > 0){
    this.echo(links[0])
  } else {
    this.echo('NONE FOUND')
  }
  this.exit()
});
