
require('colors');

const console = require('@webpart/console');
const $Object = require('@definejs/object');
const File = require('@definejs/file');
const Emitter = require('@definejs/emitter');
const Timer = require('@definejs/timer');
const App = require('@definejs/node-app');

const emitter = new Emitter();


App.cwd = __dirname;

App.modules = [
    './lib/**/*.js',
    './modules/**/*.js',
];


let website = null;


module.exports = exports = {

    defaults: require('./defaults'),

    /**
    * 
    */
    require: App.require,

    
    /**
    * 
    */
    on: emitter.on.bind(emitter),

    /**
    * 初始化一个网站实例。
    * 会触发 `init` 事件。
    * @returns {WebSite} 返回一个 WebSite 实例。 
    */
    init() {
        if (website) {
            return website;
        }

        const WebSite = App.require('WebSite');
        website = new WebSite();
        emitter.fire('init', [website]);  //先让外界有机会提前绑定事件。

        return website;
    },

    /**
    * 设置默认配置。
    */
    config(defaults) {
        const Defaults = App.require('Defaults');

        defaults = $Object.deepAssign({}, exports.defaults, defaults);

        //如果未指定应用的名称，则从包中读取。
        if (!defaults.name) {
            let pkg = File.readJSON('./package.json');
            defaults.name = pkg.name;
        }

        //把 defaults 对象中的各个字段分解到由映射规则指定的模块中去设置。
        //如 `htdocs: 'WebSite'`，表示 defaults 对象中的 `htdocs` 字段由模块 `WebSite` 去设置。
        Defaults.config(defaults, { //映射转换规则（路由规则）。
            htdocs: 'WebSite',
            edition: 'Edition',
            watcher: 'Watcher',
            metaProps: 'MetaProps',
            name: 'Watcher',            //用于监控完成后提示项目的名称。
            env: 'Env',
           
            css: {
                sample: 'Css',
                regexp: 'CssLink',
                md5: function (value) {
                    Defaults.set('MasterPage', { md5: { 'css': value, }, });
                },
                dir: function (value) {
                    Defaults.set('WebSite', { 'css': value, });
                },
            },

            less: {
                regexp: 'LessLink',
                md5: function (value) {
                    Defaults.set('MasterPage', { md5: { 'less': value, }, });
                },
            },

            js: {
                error: 'Js',
                sample: 'Js',
                regexp: 'JsLink',
                md5: function (value) {
                    Defaults.set('MasterPage', { md5: { 'js': value, }, });
                },
            },

            html: {
                regexp: 'HtmlLink',
                changeDelay:'HtmlLink',
                minify: 'Html',
            },


            tags: function (value) {
                Defaults.set('MasterPage', { 'tags': value, });
            },

            packages: function (value) {
                Defaults.set('WebSite', { 'packages': value, });
            },

            masters: function (value) {
                Defaults.set('WebSite', { 'masters': value, });
            },

        });


    },

    /**
    * 编译。
    * 编译完成后，不开启监控。
    * 在某些场景下，可能需要仅编译但不开启监控。
    * 该方法仅用于开发阶段。
    */
    compile(options) {
        let website = exports.init();
        let timer = new Timer();

        timer.start();

        //监控完成后。
        website.on('compile', function () {
            let info = timer.stop('ms');
            console.log('耗时'.gray, info.value.toString().cyan, 'ms');

            emitter.fire('done', 'compile', [website]);
        });


        //开启监控。
        website.compile(options);
    },


    /**
    * 编译并在完成后开始监控。
    * 该方法仅用于开发阶段。
    */
    watch(options) {
        let website = exports.init();
        let timer = new Timer();

        timer.start();

        //监控完成后。
        website.on('watch', function () {
            let info = timer.stop('ms');
            console.log('耗时'.gray, info.value.toString().cyan, 'ms');
           
            emitter.fire('done', 'watch', [website]);
        });


        //开启监控。
        website.watch(options);
    },

    /**
    * 构建。
    * 该方法仅用于发布到生产环境阶段。
    */
    build(options) {
        let website = exports.init();
        let timer = new Timer();

        timer.start();

        //构建完成后。
        website.on('build', function () {
            let info = timer.stop('ms');
            console.log('耗时'.gray, info.value.toString().cyan, 'ms');

            emitter.fire('done', 'build', [website]);
        });

        //开始构建。
        website.build(options);

        
    },



};


