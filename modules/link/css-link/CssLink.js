
/**
* 静态引用 css 资源文件。
*/
define('CssLink', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    
    const Css = require('Css');
    const MetaProps = require('MetaProps');

    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const Watcher = module.require('Watcher');
    const Builder = module.require('Builder');
    const MD5 = module.require('MD5');
    const Query = module.require('Query');

    const defaults = require(`${module.id}.defaults`);
    const mapper = new Map();

    class CssLink {
        /**
        * 构造器。
        *   config = {
        *       file: '',   //输入的源 css 文件路径。
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
        * 渲染生成 html 内容。
        *   内联: `<style>...</style>`。
        *   普通: `<link rel="stylesheet" href="xx.css" />`。
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
                'file': meta.file,
                'comment': true,
                'props': props,
                'tabs': opt.tabs,
            }): Css.mix({
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
                'md5': md5,             //文件内容对应的 md5 信息。
                'query': query,         //添加到 href 中 query 部分。
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

        toJSON(item) {
            let meta = mapper.get(this);
            let html = item ? this.render(item) : undefined;

            return {
                'type': module.id,
                'id': meta.id,
                'file': meta.file,
                'external': meta.external,
                'render': html,
            };
        }


        static parse(content, { dir, }) {
            return Parser.parse(content, {
                'dir': dir,
                'regexp': defaults.regexp,
            })
        }

        static build = Builder.build;
        static toJSON = Parser.toJSON;

    }





    return CssLink;



});




