
require('colors');

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



function init() { 
    const WebSite = App.require('WebSite');
    const Console = App.require('Console');

    let website = new WebSite();

    //重写原生的，以让它同时具有输出到文件的功能。
    console.log = Console.log;
    console.error = Console.error;

    //先让外界有机会提前绑定事件。
    emitter.fire('init', [website]);

    return website;
}




module.exports = {
    /**
    * 
    */
    require: App.require,

    /**
    * 
    */
    on: emitter.on.bind(emitter),

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
            console: 'Console',
            edition: 'Edition',
            watcher: 'Watcher',
            tags: 'MasterPage',
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
        let website = init();
        let timer = new Timer();

        timer.start();

        //监控完成后。
        website.on('watch', function () {
            let info = timer.stop('ms');
            console.log('耗时'.gray, info.value.toString().cyan, 'ms');
           
            emitter.fire('done', []);
        });


        //开启监控。
        website.watch(options);
    },

    /**
    * 构建。
    * 该方法仅用于发布到生产环境阶段。
    */
    build(options) {
        let website = init();
        let timer = new Timer();

        timer.start();

        //构建完成后。
        website.on('build', function () {
            let info = timer.stop('ms');
            console.log('耗时'.gray, info.value.toString().cyan, 'ms');

            emitter.fire('done', []);
        });

        //开始构建。
        website.build(options);

        
    },



};


