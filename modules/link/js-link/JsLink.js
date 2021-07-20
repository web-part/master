
/**
* 静态引用 js 资源文件。
* 事件：
*   ('render'); //渲染后，返回前触发。
*   ('change'); //
*/
define('JsLink', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const MD5 = require('@definejs/md5');
    
    const Js = require('Js');
    const MetaProps = require('MetaProps');

    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const Watcher = module.require('Watcher');
    const Builder = module.require('Builder');

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
        *   options = {
        *       inline: false,      //是否内联。
        *       tabs: 0,            //缩进的空格数。
        *       href: '',           //生成到 link 标签中的 href 属性值。
        *       md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *       query: {} || fn,    //添加到 href 中 query 部分。
        *       props: {},          //生成到标签中的其它属性。
        *   };
        */
        render(options) {
            let meta = mapper.get(this);
            let props = MetaProps.delete(options.props);    //删除元数据属性。


            //只有明确指定了内联，且为内部文件时，才能内联。
            if (options.inline && !meta.external) {
                let html = Js.inline({
                    'file': meta.file,
                    'comment': true,
                    'props': props,
                    'tabs': options.tabs,
                });


                //取事件的最后一个回调的返回值作为要渲染的内容（如果有）。
                let html2 = meta.emitter.fire('render', [meta.file, html, {
                    'external': meta.external,  //是否为外部资源。
                    'inline': options.inline,   //是否需要内联。
                    'tabs': options.tabs,       //缩进的空格数。
                    'href': options.href,       //生成到 link 标签中的 href 属性值。
                    'md5': options.md5,         //添加到 href 中 query 部分的 md5 的长度。
                    'query': options.query,     //添加到 href 中 query 部分。
                    'props': options.props,     //生成到标签中的其它属性。
                }]).slice(-1)[0];


                if (typeof html2 == 'string') {
                    html = html2;
                }

                return html;
            }


            let md5 = options.md5 || 0;
            let query = options.query || {};
            let md5Len = md5 === true ? 32 : md5;  //md5 的长度。

            if (typeof query == 'function') {
                query = query();
            }

            //内部文件才能生成 md5。
            if (!meta.external) {
                md5 = MD5.read(meta.file);

                let smd5 = md5.slice(0, md5Len); //如 `A54E`，4位的。

                if (smd5) {
                    query[smd5] = undefined; //这里要用 undefined 以消除 `=`。
                }
            }

            let html = Js.mix({
                'href': options.href,
                'props': props,
                'tabs': options.tabs,
                'query': query,
            });


            let values = meta.emitter.fire('render', [meta.file, html, {
                'md5': md5,
                'md5Length': md5Len,
                'query': query,
                'external': meta.external,
                'inline': options.inline,
                'tabs': options.tabs,
                'href': options.href,
                'props': options.props,
            }]);

            //取事件的最后一个回调的返回值作为要渲染的内容（如果有）。
            let html2 = values.slice(-1)[0];

            if (typeof html2 == 'string') {
                html = html2;
            }

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
                'id': meta.id,              //实例 id。
                'file': meta.file,          //输入的源 js 文件路径，是一个 string。
                'external': meta.external,  //是否为外部地址。
            };
        }

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




