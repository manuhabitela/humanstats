## Human Stats

humantalks.com + casperjs + d3 = Human Stats!


### Installer en local

Requis sur la machine : phantomjs, casperjs, sass, compass, node

Cloner le repo puis:

* `npm install` pour les libs nécessaires au scraper et à grunt.
* `bower install` et `grunt build` pour récupérer et compiler les libs JS client.
* `casperjs scraper/scrap.js` : met à jour les données (pas forcément besoin, elles sont dans le repo).
* `grunt server` + http://localhost:9032 pour voir ce que ça donne


### Todo

* concatener/minifier le JS avec r.js
* responsive
* urls : pouvoir directement accéder aux différents graphiques avec certains filtres
* ajouter un champ recherche pour les participants ?
* ???

### Outils utilisés

Le site utilise les données de humantalks.com (**no shit?**) et certaines données de meetup.com. Toutes les données sont récupérées avec CasperJS.

Les données sont ensuite mises en forme sur le site principalement avec d3, et le JS est structuré à l'aide de require et Backbone. L'utilisation de d3 est une première pour moi : ça se voit surement à la gueule du code :o.

Le CSS est réalisé à l'aide de Compass, Autoprefixer et surtout SUIT CSS.