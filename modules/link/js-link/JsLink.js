
/**
* 静态（单个）引用 js 资源文件。
* 事件：
*   ('render'); //渲染后，返回前触发。
*   ('change'); //
*/
define('JsLink', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');

    const Js = require('Js');
    const MetaProps = require('MetaProps');

    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const Watcher = module.require('Watcher');
    const Builder = module.require('Builder');
    const MD5 = module.require('MD5');
    const Query = module.require('Query');

    const defaults = require(`${module.id}.defaults`);
    const mapper = new Map();


    class JsLink {
        /**
        * 构造器。
        *   config = {
        *       file: '',   //输入的源 js 文件路径。
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
        * 事件：('render');
        *   内联: `<script> //js 代码 </script>`。
        *   普通: `<script src="xx.js"></script>`。
        *   opt = {
        *       inline: false,      //是否内联。
        *       tabs: 0,            //缩进的空格数。
        *       href: '',           //生成到 script 标签中的 href 属性值。
        *       md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *       query: {} || fn,    //添加到 href 中 query 部分。
        *       props: {},          //生成到标签中的其它属性。
        *   };
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

            let html = needInline ? Js.inline({
                'file': meta.file,
                'comment': true,
                'props': props,
                'tabs': opt.tabs,
            }) : Js.mix({
                'href': opt.href,
                'props': props,
                'tabs': opt.tabs,
                'query': query,
            });
            


            //取事件的最后一个回调的返回值作为要渲染的内容（如果有）。
            let html2 = meta.emitter.fire('render', [meta.file, html, {
                'external': meta.external,  //是否为外部资源。
                'inline': opt.inline,       //是否需要内联。
                'tabs': opt.tabs,           //缩进的空格数。
                'href': opt.href,           //生成到 script 标签中的 href 属性值。
                'props': props,             //生成到标签中的其它属性。
                'query': query,             //添加到 href 中 query 部分。
                'md5': md5,                 //文件内容对应的 md5 信息。
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

        /**
        * 从当取实例中提取尽量多的 json 信息。
        * @param {object} [item] 可选的配置参数。
        *   item = {
        *       tabs: 0,            //缩进的空格数。
        *       href: '',           //生成到 link 标签中的 href 属性值。
        *       md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *   };
        * @returns
        */
        toJSON(item) {
            let meta = mapper.get(this);
            let html = item ? this.render(item) : undefined;

            return {
                'type': module.id,
                'id': meta.id,              //实例 id。
                'file': meta.file,          //输入的源 js 文件路径，是一个 string。
                'external': meta.external,  //是否为外部地址。
                'render': html,
            };
        }

        //====================================================================================
        //静态方法。

        static parse(content, { dir, regexp, }) {
            return Parser.parse(content, {
                'dir': dir,
                'regexp': regexp || defaults.regexp,
            });
        }

        static build = Builder.build;
        static toJSON = Parser.toJSON;

    }



    return JsLink;



});




