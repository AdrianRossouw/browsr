browsr
------

This project crawls and rips entire tumblr image blogs into a local
cache, and provides a flexible interface to navigate through the
store images.

#### Screenshot : 
![example](/example.jpg)


Implementation
--------------

It is something of a re-implementation
of the [Tumblr Collage](https://chrome.google.com/webstore/detail/tumblr-collage/fmfgcipfpihnkblbbemdagfdhjjeilli)
chrome extension, which I felt became too unstable on larger image sites. The browser-based
nature of the original extension means it wasn't really possible to implement things I really
wanted, like saving your current location in a large collection of images.

This is also just a little demo project I built to experiment with a number of
technologies I had my eye on for a while, so don't expect much in the way of support.


#### It consists of :

1. [CouchDB](http://couchdb.apache.org) database, with all images as attachments.
1. [Elasticsearch](http://elasticsearch.org) used to index and query the data. ([Indexes the couch documents via the couchdb river](http://daemon.co.za/2012/05/elasticsearch-5-minutes/))
1. [Node.js](http://nodejs.org) based proxy, that mostly is a straight pass-through to ES/Couch.
1. [CouchApp](http://couchapp.org) to host the UI. (my first)
1. [node.io](http://node.io) based scraping back-end, allowing multi-threaded mirroring of sites. (my first)
1. [Angular](http://angularjs.org) based front end (my first)

#### It also uses : 

1. [Yeoman](http://yeoman.io) used for the [couchapp generator](https://github.com/garbados/generator-couchapp) (my first time using)
1. [Bower](http://bower.io) used for client-side dependencies, as I'm usually a [browserify guy](http://vertice.github.io/browserify-slides/#/title) (my first time)
1. [Grunt](http://gruntjs.com) used for complex build processes (my first time using for non-trivial things)
1. [Masonry](http://masonry.desandro.com/) based cascading grid layout (my first time using)
1. [ngInfiniteScroll](http://binarymuse.github.io/ngInfiniteScroll/) for infinite scrolling (my first time using)


Installation:
-------------

#### Requirements


1. couchdb running on localhost:5984
1. elasticsearch running on localhost:9200
1. node.js + npm


#### Pre-installation

    # how to get said requirements running : 

    # get the osx command line tools first
    # either from developer.apple.com/download, or from xcode.

    # install homebrew
    ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go)"

    # install elastic search
    brew install elasticsearch
    plugin -install elasticsearch/elasticsearch-river-couchdb/1.2.0

    # install couch db from the package on couchdb.apache.org

    # install nvm for node
    touch ~/.profile
    curl https://raw.github.com/creationix/nvm/master/install.sh | sh
    source ~/.nvm/nvm.sh

    # install node
    nvm install 0.10
    nvm use 0.10
   

#### Actual installation:

    npm install -g grunt-cli bower node.io

    # check out this repo
    git checkout 'whatever'
    cd browsr

    # main app
    npm install

    # couch app
    cd couch-app
    npm install
    bower install
    sh install.sh

    # build an pushes app to couchdb
    grunt

    # run the main node app
    cd ..
    node index.js


#### How to use:

application should now be listening on [localhost:5000](http://localhost:5000)

to download blogs, either use the command line :

    cd $browsrDir
    node.io tumblr sitename [start] [amount] [perbatch]

    //ex:
    node.io tumblr jl8comic 1 200 10

this is also mounted on localhost, so you can access the following to do the same :

    http://localhost:5000/jobs/tumblr/jl8comic/1/200/10

I use a bookmarklet to do that.


License:
--------

[MIT license](/LICENSE).


Todo:
-----

1. Better initiation of download tasks, rather than cli or url hacking
1. Show completion status of download tasks
1. Store download task history for future re-init.
1. Schedule regular fetching of specific tasks.
1. Configure right-click-action to have 'favorite' and 'tag' modes.
1. Figure out how to set a proper 'lastSeen' tag on multiple images at once.
1. Integrate with tumblr api through the passport-tumblr auth strategy. Should sync likes and follows.
