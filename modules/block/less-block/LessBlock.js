/**
* 动态批量引用 less 资源文件。
*/
define('LessBlock', function (require, module, exports) {
    const console = require('@webpart/console');
    const File = require('@definejs/file');
    const Emitter = require('@definejs/emitter');
    const $String = require('@definejs/string');
    const Tasker = require('@definejs/tasker');
    const MD5 = require('@definejs/md5');

    const Lines = require('Lines');
    const Css = require('Css');
    const Path = require('Path');

    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const Watcher = module.require('Watcher');

    const mapper = new Map();

    class LessBlock {
        /**
        * 构造器。
        *   config = {
        *       patterns: [],   //路径模式列表。
        *       excludes: [],   //要排除的模式列表。 里面饱含完整的目录，与字段 dir 无关。
        *       dir: '',        //字段 patterns 路径模式中的相对目录，即要解析的页面所在的目录。 如 `htdocs/html/test/`。
        *       htdocs: '',     //网站的根目录。 如 `htdocs/`。
        *       css: '',        //样式目录，相对于 htdocs。 如 `style/css/`。
        *   };
        */
        constructor(config) {
            config = Object.assign({}, config);

            let emitter = new Emitter(this);

            let meta = Meta.create(config, {
                'this': this,
                'emitter': emitter,
            });

            mapper.set(this, meta);

            Object.assign(this, {
                'id': meta.id,
                'data': {},     //用户的自定义数据容器。
            });
        }

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
        *   options = {
        *       error: function(file),      //文件不存时要执行的函数。
        *   };
        */
        parse(options) {
            let meta = mapper.get(this);
            meta.list = Parser.parse(meta, options);
        }

        /**
        * 设置特定的字段。
        */
        set(key, value) {
            let meta = mapper.get(this);

            switch (key) {
                case 'excludes':
                    let excludes = value || [];
                    let changed = JSON.stringify(excludes) != JSON.stringify(meta.excludes);

                    if (changed) {
                        meta.excludes = excludes.slice(0);
                        meta.this.reset();
                        meta.this.parse();
                        meta.this.watch();
                        meta.change();
                    }

                    break;
            }
        }


        /**
        * 编译。
        *   options = {
        *       minify: false,      //是否压缩。
        *       concat: false,      //是否合并输出的内容。
        *       dest: {
        *           each: true | '',//是否输出每个分文件对应的目标文件。 如果指定为 true，则使用解析器的结果作为其路径。
        *           all: '',        //是否输出合并后的目标文件。 仅 concat 为 true 时有效。 支持 `{md5}` 模板字段。
        *       },
        *       done: fn,           //编译完成后要执行的回函数。
        *   };
        */
        compile(options = {}) {
            let done = typeof options == 'function' ? options : options.done;
            let meta = mapper.get(this);
            let tasker = new Tasker(meta.list);
            let dest = options.dest || {};
            let concat = options.concat;

            tasker.on('each', function (item, index, done) {
                let file = dest.each;
                if (file === true) {
                    file = item.dest.file;
                }

                if (!item.link) {
                    console.error('item.link is null.');
                    console.error('item = ', item);
                    console.error('不存在 less 文件:' + item.file);
                    throw new Error();
                }

                item.link.compile({
                    'minify': options.minify,
                    'dest': file,
                    'done'(output) {
                        done(output);
                    },
                });
            });

            tasker.on('all', function (outputs) {
                //不需要合并。
                if (!concat) {
                    done && done.call(meta.this, outputs);
                    return;
                }

                //需要合并。 
                //合并压缩后，如果产生空行，则说明空的那一行对应的分文件 css 内容为空。
                let contents = outputs.map((item) => {
                    return item.css;
                });


                let content = Lines.join(contents);
                let md5 = MD5.get(content);
                let file = dest.all;

                if (file) {
                    file = $String.format(file, { 'md5': md5, });
                    File.write(file, content);
                }

                done && done.call(meta.this, {
                    'list': outputs,
                    'content': content,
                    'md5': md5,
                    'dest': file,
                });
            });

            tasker.parallel();
        }

        /**
        * 渲染生成 html。
        *   options = {
        *       inline: false,  //是否内联。
        *       tabs: 0,        //缩进的空格数。
        *       href: '',       //生成到标签中 href 属性。
        *       props: {},      //生成到标签中的其它属性。
        *   };
        */
        render(options) {
            options = options || {};

            let meta = mapper.get(this);

            meta.list.forEach((item, index) => {
                let html = item.link.render({
                    'tabs': options.tabs,
                    'inline': options.inline,
                    'props': options.props,
                    'href': item.dest.href,
                    'md5': 4,
                });

                meta.contents[index] = html;
            });

            let html = Lines.join(meta.contents);

            return html;

        }

        /**
        * 监控当前引用文件和下级列表的变化。
        */
        watch() {
            let meta = mapper.get(this);

            meta.watcher = meta.watcher || Watcher.create(meta);

            meta.list.forEach((item, index) => {
                if (item.isOld) { //复用过来的，不需要重新绑定。
                    return;
                }

                let link = item.link;

                link.on('change', function () {
                    meta.change(true);
                });

                link.watch();
            });

        }

        /**
        * 构建。
        * 已重载 build(done);
        * 已重载 build(options);
        *   options = {
        *       tabs: 0,            //缩进的空格数。
        *       minify: false,      //是否压缩。
        *       inline: false,      //是否内联。
        *       dest: '',           //输出的目标文件路径，支持 `{md5}` 模板字段。
        *       props: {},          //生成标签中的其它属性。
        *       query: {},          //生成到 href 属性中的 query 部分。
        *       done: fn,           //构建完成后的回调函数。
        *   };
        */
        build(options = {}) {
            let done = typeof options == 'function' ? options : options.done;
            let meta = mapper.get(this);

            this.compile({
                'minify': options.minify,
                'concat': true,
                'dest': {
                    'each': false,
                    'all': options.dest,
                },

                'done'(info) {
                    let html = '';

                    if (options.inline) {
                        html = Css.inline({
                            'content': info.content,
                            'tabs': options.tabs,
                            'props': options.props,
                        });
                    }
                    else {
                        let href = Path.relative(meta.dir, info.dest);

                        html = Css.mix({
                            'href': href,
                            'tabs': options.tabs,
                            'props': options.props,
                            'query': options.query,
                        });
                    }

                    done && done.call(meta.this, html);
                },
            });


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
                item.link.destroy();
            });

            meta.emitter.destroy();
            meta.watcher && meta.watcher.destroy();
            mapper.delete(this);
        }

        toJSON() {
            let meta = mapper.get(this);

            let list = Parser.toJSON(meta.list);


            let json = {
                'type': module.id,
                'id': meta.id,
                'dir': meta.dir,
                'patterns': meta.patterns,
                'excludes': meta.excludes,
                'list': list,
            };

            return json;
        }
    }



    return LessBlock;



});




