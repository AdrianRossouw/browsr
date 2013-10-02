tumblr-browsr
-------------


requirements :

1. couchdb running on localhost:5984
1. elasticsearch running on localhost:9200
1. node.js + npm

pre-installation:

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
   

actual installation:

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


How to use :

application should now be listening on [localhost:5000](http://localhost:5000)

to download blogs, either use the command line :

    cd $browsrDir
    node.io tumblr sitename [start] [amount] [perbatch]

    //ex:
    node.io tumblr jl8comic 1 200 10

this is also mounted on localhost, so you can access the following to do the same :

    http://localhost:5000/jobs/tumblr/jl8comic/1/200/10

I use a bookmarklet to do that.
