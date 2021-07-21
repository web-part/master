
/**
* 
*/
define('WebSite/Masters', function (require, module, exports) {
    const console = require('@webpart/console');
    const Log = require('Log');
    const Watcher = require('Watcher');
    const MasterBlock = require('MasterBlock');

    const JsBlock = module.require('JsBlock');
    const LessBlock = module.require('LessBlock');





    return {
        /**
        * 解析。
        *   config = {
        *       excludes: {
        *           less: [],
        *           html: [],
        *           js: [],
        *       },
        *   };
        * @returns {MasterBlock} 解析成功后返回一个 MasterBlock 实例；否则返回 null。
        */
        parse(meta, config) {
            let options = meta.masters;

            //无配置或配置中指定禁用了。
            if (!options || !options.enabled) {
                return null;
            }


            let block = new MasterBlock({
                'htdocs': meta.cwd,
                'css': meta.css,

                'patterns': options.patterns,
                'dest': options.dest,

                'excludes': config.excludes,
            });

            //转发事件。
            block.on({
                'parse': {
                    'master': function (...args) {
                        let values = meta.emitter.fire('parse', 'master', args);
                        return values.slice(-1)[0]; //返回最后一个回调函数的值。
                    },
                },
                'render': {
                    'master': function (...args) {
                        let values = meta.emitter.fire('render', 'master', args);
                        return values.slice(-1)[0]; //返回最后一个回调函数的值。
                    },
                    'js-link': function (...args) {
                        let values = meta.emitter.fire('render', 'js-link', args);
                        return values.slice(-1)[0]; //返回最后一个回调函数的值。
                    },
                },
            });

            let files = block.parse();
            let count = files.length;

            if (count > 0) {
                console.log('匹配到'.bgGreen, count.toString().cyan, '个母版页:');
                Log.logArray(files, 'green');
            }

            return block;
        },


        /**
        * 编译所有母版页。
        *   config = {
        *       options: {
        *           minify: false,      //是否压缩。
        *       },
        *       done: fn,               //编译及监控完成后要执行的回调函数。
        *   };
        */
        compile(meta, config) {
            let block = meta.MasterBlock;
            let options = config.options;
            let done = config.done;

            if (!block || !options) {
                return done();
            }

            block.on('compile', 'master', {
                'before': function (item) {
                    Log.seperate();
                    console.log('>> 开始编译'.cyan, item.file);
                },

                'done': function (item) {
                    console.log('<< 完成编译'.green, item.file);
                },

                'all': function () {
                    done();
                },
            });

            block.compile({
                'minify': options.minify,
                //'done'() {}, //不指定 done，则会触发 ('compile', 'master', 'all') 事件。
            });

        },

        /**
        * 编译所有母版页，完成后开启监控。
        *   config = {
        *       options: {
        *           minify: false,      //是否压缩。
        *       },
        *       done: fn,               //编译及监控完成后要执行的回调函数。
        *   };
        */
        watch(meta, config) {
            let block = meta.MasterBlock;
            let options = config.options;
            let done = config.done;

            if (!block || !options) {
                return done();
            }


            block.on('change', function () {
                this.compile({
                    'minify': options.minify,
                    'done'() { //指定了 done，则不会触发 ('compile', 'master', 'all') 事件。
                        Watcher.log();
                    },
                });
            });

            block.on('compile', 'master', {
                'before': function (item) {
                    Log.seperate();
                    console.log('>> 开始编译'.cyan, item.file);
                },

                'done': function (item) {
                    console.log('<< 完成编译'.green, item.file);
                },

                'all': function () {
                    console.log('准备开始监控，请稍候...');
                    block.watch();      //开启监控。
                    done();
                },
            });

            block.compile({
                'minify': options.minify,
                //'done'() {}, //不指定 done，则会触发 ('compile', 'master', 'all') 事件。
            });

        },

        /**
        * 构建所有母版页。
        *   config = {
        *       options: {
        *           lessLink: {},
        *           lessBlock: {},  
        *           jsBlock: {},
        *           html: {},
        *       },
        *       done: fn,               //编译及监控完成后要执行的回调函数。
        *   };
        */
        build(meta, config) {
            let block = meta.MasterBlock;
            let options = config.options;
            let done = config.done;

            if (!block || !options) {
                return done();
            }


            let lessBlock = LessBlock.normalize(meta, options.lessBlock);
            let jsBlock = JsBlock.normalize(meta, options.jsBlock);

            block.on('build', 'master', {
                'before': function (item) {
                    Log.seperate();
                    console.log('>> 开始构建'.cyan, item.file);
                },

                'done': function (item) {
                    console.log('<< 完成构建'.green, item.file);
                },

                'all': function () {
                    done(); //完成当前任务。
                },
            });


            block.build({
                'lessLink': options.lessLink,
                'lessBlock': lessBlock,
                'jsBlock': jsBlock,
                'html': options.html,
            });

        },


    };




});




