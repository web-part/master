
/**
* 
*/
define('JsLink/Builder', function (require, module, exports) {
    const Query = require('@definejs/query');
    const File = require('@definejs/file');
    const MD5 = require('@definejs/md5');
    
    const Js = require('Js');
    const Edition = require('Edition');


    //生成引用内部或外部资源的 `<script>` 标签。
    function render(item, md5) {
        let href = item.href;
        let props = Object.assign({}, item.props);

        delete props['data-meta'];

        if (item.debug) {
            href = Edition.toMin(href);
        }

        if (md5) {
            href = Query.add(href, md5);
        }

        let html = Js.mix({
            'href': href,
            'props': props,
            'tabs': item.tabs,
            'query': item.query,
        });

        return html;
    }



    return {
        /**
        * 构建(异步方式)。
        *   item = {
        *       line: '',       //当前 `<script>` 标签所在的整行 html。
        *       debug: false,   //当前 `<script>` 标签是否为 debug 版。 即引用的文件是否为 `.debug.js` 作为后缀名。
        *       min: false,     //当前 `<script>` 标签是否为 min 版。 即引用的文件是否为 `.min.js` 作为后缀名。
        *       href: '',       //
        *       file: '',       //
        *       inline: false,  //是否需要内联。
        *       tabs: 0,        //缩进的空格数。
        *       props: {},      //
        *       query: {},      //
        *   };
        */
        build(item, done) {
            //外部资源。
            //如果是 debug 版的引用，则替换成 min 版的。
            if (item.external) {
                let html = render(item);
                done(html);
                return;
            }


            //内部资源。

            let file = item.file;


            //引用的是内部 min 版。
            //直接读取使用。
            if (item.min) {
                let content = File.read(file);
                mix(content);
                return;
            }


            //引用的是内部 debug 版。 
            //先进行压缩，写入 min 版文件。
            //如果已存在对应的压缩文件，则直接读取使用。
            //一些第三方库文件，建议自己提供 min 版的在同一个目录，以避免本工具压缩。
            //因为本工具压缩 debug 版输出 min 版后，会删掉所有的注释，从而删掉文件头一大堆注释掉的版权信息等。
            //而引用第三方库，最好不要删掉文件头的版权注释等，这是一个道德规范。
            if (item.debug) {
                let dest = Edition.toMin(file);

                //已存在目标压缩文件，直接读取使用。
                if (File.exists(dest)) {
                    let content = File.read(dest);
                    mix(content);
                    return;
                }

                //先压缩，再写入压缩文件。
                //考虑到多个页面共用一个 js 文件，不管是否内联都输出 `.min.js` 文件。
                Js.minify({
                    'src': file,
                    'dest': dest,
                    'done': mix,
                });

                return;
            }



            //引用的是内部普通版，即既不是 debug 版，也非 min 版。
            //先进行压缩，写入 min 版文件，再使用压缩后的内容。
            Js.minify({
                'file': file,
                'done': mix,
            });


            //内部公共方法
            function mix(content) {
                let html = '';

                if (item.inline) {
                    html = Js.inline({
                        'content': content,
                        'tabs': item.tabs,
                        'props': item.props,
                    });
                }
                else {
                    let md5 = MD5.get(content, 4);
                    html = render(item, md5);
                }

                done(html);
            }

           
        },
    };
    
});


