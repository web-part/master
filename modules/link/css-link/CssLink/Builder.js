
/**
* 
*/
define('CssLink/Builder', function (require, module, exports) {
    const Query = require('@definejs/query');
    const File = require('@definejs/file');
    const MD5 = require('@definejs/md5');

    const MetaProps = require('MetaProps');
    const Css = require('Css');
    const Edition = require('Edition');



    function minify(file, done) {
        let dest = Edition.toMin(file);

        if (File.exists(dest)) {
            let content = File.read(dest);
            return done(content);
        }

        Css.minify({
            'src': file,
            'done'(content) {
                done(content);
            },
        });
    }

    

    return {
        /**
        * 构建。
        * 异步方式。
        */
        build(item, done) {
            //外部资源。
            if (item.external) {
                let html = item.line;

                if (item.debug) {
                    let href = Edition.toMin(item.href);
                    html = item.line.replace(item.href, href);
                }

                return done(html);
            }



            //内部资源。

            let file = item.file;

            //内部 debug 版。
            if (item.debug) {
                minify(file, mix);
                return;
            }

            //内部 min 版。
            if (item.min) {
                let content = File.read(file);
                mix(content);
                return;
            }

            //普通版。
            Css.minify({
                'file': file,
                'done': mix,
            });


            //内部公共方法
            function mix(content) {
                let html = '';
                let props = MetaProps.delete(item.props);

                if (item.inline) {
                    html = Css.inline({
                        'content': content,
                        'tabs': item.tabs,
                        'props': props,
                    });
                }
                else {
                    let md5 = MD5.get(content, 4);
                    let dest = Edition.toMin(item.href);

                    dest = Query.add(dest, md5);

                    //html = item.line.replace(item.href, dest);
                    //用下面这种方式，可以按模板生成。

                    html = Css.mix({
                        'href': dest,
                        'tabs': item.tabs,
                        'props': props,
                        'query': item.query,
                    });
                }

                done(html);
            }

           
        },
    };
    
});


