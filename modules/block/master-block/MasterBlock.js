/**
* 动态批量引用母版页资源文件。
* 事件：
*   ('change');
*   ('render', 'master');
*   ('render', 'js-link');
*   ('compile', 'master', 'before');
*   ('compile', 'master', 'done');
*   ('build', 'master', 'before');
*   ('build', 'master', 'done');
*   ('build', 'master', 'all');
*/
define('MasterBlock', function (require, module, exports) {
    const console = require('@webpart/console');
    const Emitter = require('@definejs/emitter');
    const Tasker = require('@definejs/tasker');

    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const Watcher = module.require('Watcher');

    const mapper = new Map();

    class MasterBlock {
        /**
        * 构造器。
        *   opt = {
        *       patterns: [],   //路径模式列表。
        *       excludes: {},   //用于传递给 MasterPage 实例。 要排除的路径模式。
        *       htdocs: '',     //用于传递给 MasterPage 实例。 网站的根目录。 如 `htdocs/`。
        *       css: '',        //用于传递给 MasterPage 实例。 样式目录，相对于 htdocs。 如 `style/css/`。
        *       dest: '',       //用于传递给 MasterPage 实例。 输出的目标页面的名称模板。 如 `{name}.html`。
        *   };
        */
        constructor(config) {
            config = { ...config, };

            let emitter = new Emitter(this);

            let meta = Meta.create(config, {
                'this': this,
                'emitter': emitter,
            });

            mapper.set(this, meta);

            Object.assign(this, {
                'id': meta.id,
                'data': {},           //用户自定义数据容器。
            });
        }

        id = '';
        data = {};

        /**
        * 重置为初始状态，为新一轮的解析做准备。
        */
        reset() {
            let meta = mapper.get(this);
            Meta.reset(meta);
        }

        /**
        * 解析。
        */
        parse() {
            let meta = mapper.get(this);
            meta.list = Parser.parse(meta);

            let files = meta.list.map((item) => {
                return item.file;
            });

            return files;
        }

        /**
        * 设置特定的字段。
        */
        set(key, value) {
            let meta = mapper.get(this);

            switch (key) {
                case 'excludes': //设置要排除的模式。
                    meta.list.forEach((item) => {
                        item.master.set(key, value);
                    });
                    break;
            }
        }

        /**
        * 编译。
        *   opt = {
        *       minify: false,      //是否压缩。
        *
        *       //可选。 编译完成后要执行的回函数。
        *       //如果不指定，则会触发 ('compile', 'master', 'all'); 事件。
        *       done: fn,
        *   };
        */
        compile(opt = {}) {
            let done = typeof opt == 'function' ? opt : opt.done;
            let meta = mapper.get(this);
            let tasker = new Tasker(meta.list);
            let key = JSON.stringify(opt);  //缓存用的 key 与 opt 有关。

            tasker.on('each', function (item, index, done) {
                let output = item.key$output[key];

                if (output) {
                    console.log('使用缓存'.bgGreen, item.file.gray);
                    item.output = output;
                    return done();
                }

                meta.emitter.fire('compile', 'master', 'before', [item]);

                item.master.compile({
                    'minify': opt.minify,

                    'done': function () {
                        item.key$output[key] = true;
                        item.output = true;
                        meta.emitter.fire('compile', 'master', 'done', [item]);
                        done();
                    },
                });
            });

            //两种方式之一来执行回调。
            //如果指定了回调函数，则用回调函数的方式。
            //否则用触发事件的方式。
            tasker.on('all', function () {
                if (done) {
                    done.call(meta.this);
                }
                else {
                    meta.emitter.fire('compile', 'master', 'all', []);
                }
            });

            tasker.parallel();
        }

        /**
        * 监控列表的变化。
        */
        watch() {
            let meta = mapper.get(this);

            meta.watcher = meta.watcher || Watcher.create(meta);

            meta.list.forEach((item, index) => {
                if (item.isOld) { //复用过来的，不需要重新绑定。
                    return;
                }

                let master = item.master;

                master.on('change', function () {
                    item.output = null;
                    item.key$output = {};

                    meta.change(100);
                });

                master.watch();
            });

        }


        /**
        * 构建。
        *   opt = {
        *       lessLink: {},
        *       lessBlock: {},
        *       jsBlock: {},
        *       html: {},
        *   };
        */
        build(opt) {
            let meta = mapper.get(this);

            //并行处理任务。
            let tasker = new Tasker(meta.list);

            tasker.on('each', function (item, index, done) {
                let master = item.master;

                meta.emitter.fire('build', 'master', 'before', [item]);

                master.build({
                    'lessLink': opt.lessLink,
                    'lessBlock': opt.lessBlock,
                    'jsBlock': opt.jsBlock,
                    'html': opt.html,

                    'done'() {
                        meta.emitter.fire('build', 'master', 'done', [item]);
                        done(master);
                    },
                });
            });

            tasker.on('all', function (masters) {
                meta.emitter.fire('build', 'master', 'all');
            });

            tasker.parallel();
        }



        /**
        * 绑定事件。
        */
        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }

        /**
        * 销毁当前对象。
        */
        destroy() {
            let meta = mapper.get(this);
            if (!meta) { //已销毁。
                return;
            }

            meta.list.forEach((item) => {
                item.master.destroy();
            });

            meta.emitter.destroy();
            meta.watcher && meta.watcher.destroy();
            mapper.delete(this);
        }

        toJSON() {
            let meta = mapper.get(this);
            let list = Parser.toJSON(meta.list);

            return {
                'type': module.id,
                'id': meta.id,
                'patterns': meta.patterns,
                // 'excludes': meta.excludes, //这个是透传给 MasterPage 的，不需要在这里展示。
                'dest': meta.dest,
                'list': list,
            };

        }

    }





    return MasterBlock;



});




