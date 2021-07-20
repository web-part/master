
/**
* 
*/
define('MasterPage/Meta', function (require, module, exports) {
    const $String = require('@definejs/string');
    const Path = require('Path');
    const Watcher = require('Watcher');
    const ID = require('ID');


    return {
        /**
        * 
        */
        create(config, others) {
            let file = config.file;         //如 `htdocs/test/index.master.html`。
            let dest = config.dest;         //如 `{name}.html`。
            let dir = Path.dir(file);       //如 `htdocs/test/`。
            let name = Path.base(file);     //如 `index.master`。
            let excludes = config.excludes || {};   //需要排除的模式。
            let tid = null;                 //针对 meta.mix() 中的。
            let id = ID.next(module.parent.id);

            name = Path.base(name);         //如 `index`。
            dest = dir + dest;              //如 `htdocs/test/{name}.html`。
            dest = $String.format(dest, { 'name': name, }); //如 `htdocs/test/index.html`。


            let meta = {
                'id': id,                   //实例 id。
                'name': name,               //短名称。
                'file': file,               //当前母版页的文件路径。
                'dir': dir,                 //当前母版页所在的目录。
                'dest': dest,               //输出的目标页面的路径。
                'htdocs': config.htdocs,    //网站的根目录。
                'css': config.css,          //样式目录，相对于网站的根目录，如 `style/css/`。
                'delay': config.delay || 0, //需要延迟执行 meta.mix() 方法的毫秒数。 通过指定该参数，可以让一定时间内的多个调用合并成一个。


                'this': null,               //方便内部引用自身的实例。
                'emitter': null,            //事件驱动器。
                'watcher': null,            //Watcher 实例。
                'link': null,               //当前母版页对应的 HtmlLink 实例。


                'content': '',              //当前母版页的内容。
                'lines': [],                //content 按行分裂的数组。

                'CssLinks': [],             //静态的 css 引用列表。
                'LessLinks': [],            //静态的 less 引用列表。
                'HtmlLinks': [],            //静态的 html 引用列表。
                'JsLinks': [],              //静态的 js 引用列表。

                'LessBlocks': [],           //LessBlock 实例列表，即动态的 less 引用列表。
                'HtmlBlocks': [],           //HtmlBlock 实例列表，即动态的 html 引用列表。
                'JsBlocks': [],             //JsBlock 实例列表，即动态的 js 引用列表。

                //
                'css$link': {},             //css 文件名对应的 CssLink 实例。
                'less$link': {},            //less 文件名对应的 LessLink 实例。
                'js$link': {},              //js 文件名对应的 JsLink 实例。

                'patterns$HtmlBlock': {},   //路径模式对应的的 HtmlBlock 实例。
                'patterns$LessBlock': {},   //路径模式对应的的 LessBlock 实例。
                'patterns$JsBlock': {},     //路径模式对应的的 JsBlock 实例。

                //
                'excludes': {
                    'less': excludes.less || [],    //
                    'html': excludes.html || [],    //
                    'js': excludes.js || [],        //
                },

                //标记批量动态引入 less、html、js 的区块的开始标记和结束标记。 
                'tags': {
                    'less': config.tags.less,
                    'html': config.tags.html,
                    'js': config.tags.js,
                },

                //
                'old': {                    //重新解析前对一些字段的备份。
                    'css$link': {},             //css 文件名对应的 CssLink 实例。
                    'less$link': {},            //less 文件名对应的 LessLink 实例。
                    'js$link': {},              //js 文件名对应的 JsLink 实例。

                    'patterns$HtmlBlock': {},   //路径模式对应的的 HtmlBlock 实例。
                    'patterns$LessBlock': {},   //路径模式对应的的 LessBlock 实例。
                    'patterns$JsBlock': {},     //路径模式对应的的 JsBlock 实例。
                },

                /**
                * 混入生成 html 内容。
                * 带有 delay 的是给 watch 中的 change 调用。
                */
                mix(delay) {
                    if (!delay) {
                        return meta.this.render();
                    }

                    if (delay === true) {
                        delay = meta.delay;
                    }

                    clearTimeout(tid);

                    tid = setTimeout(() => {
                        meta.this.render({
                            'minify': false,
                            'dest': true,
                        });

                        Watcher.log();

                    }, delay);

                },

                change() {
                    meta.emitter && meta.emitter.fire('change');
                },
            };




            Object.assign(meta, others);


            return meta;

        },

        /**
        * 
        */
        reset: function (meta) {
            meta.old.less$link = meta.less$link;
            meta.old.js$link = meta.js$link;
            meta.old.patterns$HtmlBlock = meta.patterns$HtmlBlock;
            meta.old.patterns$LessBlock = meta.patterns$LessBlock;
            meta.old.patterns$JsBlock = meta.patterns$JsBlock;

            Object.assign(meta, {
                'content': '',              //当前母版页的内容。
                'lines': [],                //content 按行分裂的数组。

                'css$link': {},             //css 文件名对应的 CssLink 实例。
                'less$link': {},            //less 文件名对应的 LessLink 实例。
                'js$link': {},              //js 文件名对应的 JsLink 实例。

                'patterns$HtmlBlock': {},   //路径模式对应的的 HtmlList 实例。
                'patterns$LessBlock': {},   //路径模式对应的的 LessList 实例。
                'patterns$JsBlock': {},     //路径模式对应的的 JsList 实例。
            });

        },


    };

});


