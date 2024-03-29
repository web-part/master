
/**
* 
*/
define('JsLink/Parser', function (require, module, exports) {
    const cheerio = require('cheerio');
    
    const Path = require('Path');
    const Lines = require('Lines');
    const Url = require('Url');
    const MetaProps = require('MetaProps');
    const Edition = require('Edition');



    return {
        /**
        * 从指定的 html 内容中解析出 `<script src="xx"></script>` 的标签列表信息。
        *   opt = {
        *       dir: '',        //script 标签里的 src 属性相对的目录，即要解析的页面所在的目录。
        *       regexp: RegExp, //提取出引用了 js 文件的 script 标签的正则表达式。
        *   };
        */
        parse(content, { dir, regexp, }) {
            let list = content.match(regexp);

            if (!list) {
                return [];
            }

            let $ = cheerio;                    //后端的 jQuery 对象。
            let lines = Lines.split(content);   //内容按行分裂的数组。
            let startNo = 0;                    //下次搜索的起始行号。



            list = list.map((item, index) => {
                let no = Lines.getIndex(lines, item, startNo);  //行号。
                let line = lines[no];                           //整一行的 html。

                //该行已给注释掉了。
                if (Lines.commented(line, item)) { 
                    return;
                }


                let props = $(item).attr();             //<script> 标签里的全部属性。
                let href = props.src;                   //<script> 标签里的 src 属性。
                let external = Url.checkFull(href);     //是否为外部地址。
                let tabs = line.indexOf(item);          //前导空格数。
                let file = href.split('?')[0];          //去掉 query 部分后的主体。
                let query = href.split('?')[1] || '';   //query 串。
                let meta = MetaProps.parse(props);      //解析标签里的元数据。
                let inline = meta.inline == 'true';     //是否需要内联。
                let edition = Edition.parse(file);      //返回如 { ext: '.debug.js', debug: true, min: false, } 的结构。

                if (!external) {
                    file = Path.join(dir, file);
                }

               

                startNo = no + 1;


                return {
                    'no': no,               //所在的行号，从 0 开始。
                    'href': href,           //原始地址。
                    'external': external,   //是否为外部 js，即使用 `http://` 完整地址引用的外部 js 资源。
                    'debug': edition.debug, //是否为 debug 版本。
                    'min': edition.min,     //是否为 min 版本。
                    'ext': edition.ext,     //后缀名，是 `.debug.js` 或 `.min.js` 或 `.js` 等。
                    'file': file,           //完整的物理路径。 
                    'query': query,         //src 中的 query 串。
                    'html': item,           //标签的 html 内容。
                    'line': line,           //整一行的 html 内容。
                    'tabs': tabs,           //前导空格数。
                    'inline': inline,       //是否需要内联。
                    'props': props,         //html 标签里的所有属性。
                    'meta': meta,           //标签里的元数据。
                    'link': null,           //file 对应的 JsLink 实例，此处先从语义上占位。
                };


            }).filter((item) => {

                return !!item;
            });


            return list;

        },

        /**
        * 从静态的 JsLink 节点列表提取 json 信息。
        * @param {Array} list 静态的 JsLink 节点列表。
        *  列表中的每个元素 item = {}; 为 parse() 方法中返回的结果。
        * @returns 返回一个 json 信息列表。
        */
        toJSON(list) {

            list = list.map((item) => {
                let link = item.link.toJSON({
                    ...item,
                    md5: 4,
                });

                return {
                    'no': item.no,              //所在的行号，从 0 开始。
                    'href': item.href,          //原始地址。
                    'external': item.external,  //是否为外部 js，即使用 `http://` 完整地址引用的外部 js 资源。
                    'debug': item.debug,        //是否为 debug 版本。
                    'min': item.min,            //是否为 min 版本。
                    'ext': item.ext,            //后缀名，是 `.debug.js` 或 `.min.js` 或 `.js` 等。
                    'file': item.file,          //完整的物理路径。
                    'query': item.query,        //src 中的 query 串。
                    'html': item.html,          //标签的 html 内容。
                    'line': item.line,          //整一行的 html 内容。
                    'tabs': item.tabs,          //前导空格数。
                    'inline': item.inline,      //是否需要内联。
                    'props': item.props,        //html 标签里的所有属性。
                    'link': link,               //
                };
            });

            return list;
        },




    };

});


