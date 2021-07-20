
require('colors');

const console = require('@webpart/console');
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
        if (!website) {
            const WebSite = App.require('WebSite');
            website = new WebSite();
            emitter.fire('init', [website]);  //先让外界有机会提前绑定事件。
        }

        return website;
    },

    /**
    * 设置默认配置。
    */
    config(defaults) {
        let Defaults = App.require('Defaults');

        //如果未指定应用的名称，则从包中读取。
        if (!defaults.name) {
            let pkg = File.readJSON('./package.json');
            defaults.name = pkg.name;
        }

        Defaults.config(defaults, { //映射转换规则（路由规则）。
            htdocs: 'WebSite',
            edition: 'Edition',
            watcher: 'Watcher',
            metaProps: 'MetaProps',
            name: 'Watcher',            //用于监控完成后提示项目的名称。
            less: 'LessLink',
           
            css: {
                sample: 'Css',
                regexp: 'CssLink',
                dir: function (value) {
                    Defaults.set('WebSite', { 'css': value, });
                },
            },

            js: {
                error: 'Js',
                sample: 'Js',
                regexp: 'JsLink',
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


