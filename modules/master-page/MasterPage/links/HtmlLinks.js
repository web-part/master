
/**
* 
*/
define('MasterPage/HtmlLinks', function (require, module, exports) {
    const HtmlLink = require('HtmlLink');



    return exports = {

        /**
        * 
        */
        parse(meta) {
            //下级静态引用对应的 HtmlLink 实例。
            let list = [];

            //当前母版页对应的 HtmlLink 实例，因为母版页也是一个 html 片段页。
            let link = meta.link || new HtmlLink({
                'file': meta.file,
                'content': meta.content,
            });

            link.reset();
            link.parse();

            link.each((item) => {
                list.push(item);
            });

            meta.link = link;

            return list;

        },

        /**
        * 
        */
        render(meta, done) {
            meta.HtmlLinks.forEach((item) => {
                let html = item.link.render({
                    'tabs': item.tabs,
                });

                meta.lines[item.no] = html;
            });

            done();
        },

        /**
        *
        */
        watch(meta) {

            meta.HtmlLinks.forEach((item) => {

                item.link.on('change', function () {
                    let html = this.render({
                        'tabs': item.tabs,
                    });

                    meta.lines[item.no] = html;
                    meta.mix(true);

                });

                item.link.watch();

            });
        },
       

        toJSON(meta) {
            let list = HtmlLink.toJSON(meta.HtmlLinks);
            return list;
        },


    };

});


