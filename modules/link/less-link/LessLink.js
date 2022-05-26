
/**
* 单个静态引用 less 资源文件。
*/
define('LessLink', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const $String = require('@definejs/string');
    const File = require('@definejs/file');

    const Less = require('Less');
    const Css = require('Css');
    const MetaProps = require('MetaProps');

    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const Watcher = module.require('Watcher');
    const MD5 = module.require('MD5');
    const Query = module.require('Query');

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
        * 已重载 compile(done);  //使用默认配置进行编译，完成后执行参数传入的回调函数。
        * 已重载 compile(opt);   //使用指定的配置进行编译，完成后可以执行配置中的回调函数。
        *   opt = {
        *       minify: false   //是否压缩。
        *       dest: '',       //输出的目标文件路径。 支持编译后的内容 `{md5}` 模板字段。
        *       done: fn,       //编译完成后的回调函数。
        *   };
        */
        compile(opt = {}) {
            let done = typeof opt == 'function' ? opt : opt.done;
            let meta = mapper.get(this);

            Less.compile({
                'src': meta.file,
                'minify': opt.minify,

                'done': function(css, md5) {
                    let dest = opt.dest || '';
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
                        'minify': opt.minify,
                    };

                    done && done.call(meta.this, output);
                },
            });
        }

        /**
        * 渲染生成 html 内容。
        *   内联: `<style>...</style>`。
        *   普通: `<link href="xx.css" rel="stylesheet" />`。
        *   opt = {
        *       inline: false,      //是否内联。
        *       tabs: 0,            //缩进的空格数。
        *       href: '',           //生成到 link 标签中的 href 属性值。
        *       md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *       query: {} || fn,    //添加到 href 中 query 部分。
        *       props: {},          //生成到标签中的其它属性。
        *    };
        */
        render(opt) {
            let meta = mapper.get(this);

            //不符合当前设定的环境，则不生成 html 内容。
            //明确返回 null，可以删除该行内容，而不是生成一个空行。
            if (!meta.isEnvOK) {
                return null; 
            }

            let props = MetaProps.delete(opt.props);    //删除元数据属性。
            let md5 = MD5.get(meta, opt.md5);
            let query = Query.get(meta, opt.query, md5);

            
            //只有明确指定了内联，且为内部文件时，才能内联。
            let needInline = opt.inline && !meta.external;

            let html = needInline ? Css.inline({
                'content': meta.output.css,
                'comment': meta.file,
                'props': props,
                'tabs': opt.tabs,
            }) : Css.mix({
                'href': opt.href,
                'tabs': opt.tabs,
                'props': props,
                'query': query,
            });

            //取事件的最后一个回调的返回值作为要渲染的内容（如果有）。
            let html2 = meta.emitter.fire('render', [meta.file, html, {
                'inline': opt.inline,   //是否需要内联。
                'tabs': opt.tabs,       //缩进的空格数。
                'href': opt.href,       //生成到 link 标签中的 href 属性值。
                'props': props,         //生成到标签中的其它属性。
                'query': query,         //添加到 href 中 query 部分。
                'md5': md5,             //文件内容对应的 md5 信息。
                'output': meta.output,  //编译后的 css 的输出内容。
            }]).slice(-1)[0];

            if (html2 !== undefined) {
                html = html2;
            }

            return html;
        }

        /**
        * 监控。
        */
        watch() {
            let meta = mapper.get(this);

            if (meta.watcher || !meta.isEnvOK || meta.external) {
                return;
            }

            meta.watcher = Watcher.create(meta);
        }

        /**
        * 构建。
        * 已重载 build(done);       //使用默认配置进行编译，完成后执行参数传入的回调函数。
        * 已重载 build(opt);        //使用指定的配置进行编译，完成后可以执行配置中的回调函数。
        *   opt = {
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
        build(opt = {}) {
            let done = typeof opt == 'function' ? opt : opt.done;
            let meta = mapper.get(this);

            this.compile({
                'minify': opt.minify,
                'dest': opt.dest,

                'done': function(output) {
                    let md5 = output.md5;
                    let href = opt.href;

                    if (href) {
                        href = $String.format(href, { 'md5': md5, });
                    }

                    let html = this.render({
                        'tabs': opt.tabs,
                        'props': opt.props,
                        'inline': opt.inline,
                        'query': opt.query,
                        'md5': opt.md5,
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

        /**
        * 
        * @param {*} item 
        * @returns 
        */
        toJSON(item) {
            let meta = mapper.get(this);
            let html = item ? this.render(item) : undefined;

            return {
                'type': module.id,  //
                'id': meta.id,      //实例 id。
                'file': meta.file,  //输入的源 less 文件路径，是一个 string。
                'render': html,     //
            };
        }

        //静态成员。

        static parse(content, opt) { 
            return Parser.parse(content, {
                'regexp': opt.regexp || defaults.regexp,
                ...opt,
            });
        }

        static get = Parser.get;
        static toJSON = Parser.toJSON;

    }




    return LessLink;



});




