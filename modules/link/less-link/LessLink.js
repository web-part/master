
/**
* 静态单个引用 less 资源文件。
*/
define('LessLink', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const $String = require('@definejs/string');
    const File = require('@definejs/file');

    const Less = require('Less');
    const Css = require('Css');

    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const Watcher = module.require('Watcher');

    const defaults = require(`${module.id}.defaults`);
    const mapper = new Map();



    class LessLink{
        /**
        * 构造器。
        *   config = {
        *       file: '',   //输入的源 less 文件路径。
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

        /**
        * 实例的 id。
        */
        id = '';

        /**
        * 实例的自定义数据。
        */
        data = {};


        /**
        * 编译。
        * 已重载 compile(done);     //使用默认配置进行编译，完成后执行参数传入的回调函数。
        * 已重载 compile(options);  //使用指定的配置进行编译，完成后可以执行配置中的回调函数。
        *   options = {
        *       minify: false   //是否压缩。
        *       dest: '',       //输出的目标文件路径。 支持编译后的内容 `{md5}` 模板字段。
        *       done: fn,       //编译完成后的回调函数。
        *   };
        */
        compile(options = {}) {
            let done = typeof options == 'function' ? options : options.done;
            let meta = mapper.get(this);

            Less.compile({
                'src': meta.file,
                'minify': options.minify,

                'done'(css, md5) {
                    let dest = options.dest || '';
                    let output = meta.output;

                    if (dest) {
                        dest = $String.format(dest, { 'md5': md5, });

                        //此次要写入的跟上次已写入的相同。
                        let existed =
                            dest === output.dest &&
                            md5 === output.md5;

                        if (!existed) {
                            File.write(dest, css);
                        }
                    }

                    output = meta.output = {
                        'css': css,
                        'md5': md5,
                        'src': meta.file,
                        'dest': dest,
                        'minify': options.minify,
                    };

                    done && done.call(meta.this, output);
                },
            });
        }

        /**
        * 渲染生成 html 内容。
        *   内联: `<style>...</style>`。
        *   普通: `<link href="xx.css" rel="stylesheet" />`。
        *   options = {
        *       inline: false,      //是否内联。
        *       tabs: 0,            //缩进的空格数。
        *       href: '',           //生成到 link 标签中的 href 属性值。
        *       md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *       query: {} || fn,    //添加到 href 中 query 部分。
        *       props: {},          //生成到标签中的其它属性。
        *    };
        */
        render(options) {
            let meta = mapper.get(this);

            //内联方式。
            if (options.inline) {
                let html = Css.inline({
                    'content': meta.output.css,
                    'comment': meta.file,
                    'props': options.props,
                    'tabs': options.tabs,
                });

                return html;
            }

            //普通方式。
            let md5 = options.md5 || 0;
            let href = options.href;
            let query = options.query || {};

            if (typeof query == 'function') {
                query = query(meta.output);
            }

            md5 = md5 === true ? 32 : md5;          //需要截取的 md5 长度。 

            if (md5 > 0) {
                md5 = meta.output.md5.slice(0, md5);    //md5 串值。
                query[md5] = undefined; //这里要用 undefined 以消除 `=`。
            }

            let html = Css.mix({
                'href': href,
                'tabs': options.tabs,
                'props': options.props,
                'query': query,
            });

            return html;
        }

        /**
        * 监控。
        */
        watch() {
            let meta = mapper.get(this);

            if (meta.watcher) {
                return;
            }

            meta.watcher = Watcher.create(meta);
        }

        /**
        * 构建。
        * 已重载 build(done);       //使用默认配置进行编译，完成后执行参数传入的回调函数。
        * 已重载 build(options);    //使用指定的配置进行编译，完成后可以执行配置中的回调函数。
        *   options = {
        *       minify: false,      //是否压缩。
        *       tabs: 0,            //缩进的空格数。
        *       inline: false,      //是否内联。
        *       dest: '',           //输出的目标文件路径。 支持编译后的内容 `{md5}` 模板字段。
        *       href: '',           //生成到 link 标签中的 href 属性值。
        *       query: null || fn,  //添加到 href 中 query 部分。
        *       md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *       props: {},          ///生成到标签中的其它属性。
        *       done: fn,           //构建完成后的回调函数。
        *   };
        */
        build(options = {}) {
            let done = typeof options == 'function' ? options : options.done;
            let meta = mapper.get(this);

            this.compile({
                'minify': options.minify,
                'dest': options.dest,

                'done'(output) {
                    let md5 = output.md5;
                    let href = options.href;

                    if (href) {
                        href = $String.format(href, { 'md5': md5, });
                    }

                    let html = this.render({
                        'tabs': options.tabs,
                        'props': options.props,
                        'inline': options.inline,
                        'query': options.query,
                        'md5': options.md5,
                        'href': href,
                    });

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

            meta.emitter.destroy();
            meta.watcher && meta.watcher.destroy();
            mapper.delete(this);
        }

        toJSON() {
            let meta = mapper.get(this);

            return {
                'type': module.id,
                'id': meta.id,      //实例 id。
                'file': meta.file,  //输入的源 less 文件路径，是一个 string。
                'output': meta.output,
            };
        }

        //静态成员。

        static parse(content, options) { 
            return Parser.parse(content, {
                'regexp': options.regexp || defaults.regexp,
                ...options,
            });
        }

        static get = Parser.get;
        static toJSON = Parser.toJSON;

    }




    return LessLink;



});




