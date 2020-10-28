/**
* 
*/
define('HtmlLink/Parser', function (require, module, exports) {
    const cheerio = require('cheerio');
    const File = require('@definejs/file');

    const Path = require('Path');
    const Lines = require('Lines');


    function parse(content, { regexp, dir, }) {
        //提取出如引用了 html 分文件的 link 标签
        let list = content.match(regexp);
        let lines = Lines.split(content);

        if (!list) {
            return {
                lines,
                list: [],
            };
        }


        let startNo = 0;    //下次搜索的起始行号

        list = list.map((item, index) => {
            let no = Lines.getIndex(lines, item, startNo);  //行号。
            let line = lines[no];                           //整一行的 html。

            if (Lines.commented(line, item)) { //已给注释掉了。
                return null;
            }


            let $ = cheerio;
            let props = $(item).attr();
            let href = props.href;
            let file = Path.join(dir, href);

            startNo = no + 1;

            let tabs = line.indexOf(item);              //前导空格数。

            return {
                no,           //所在的行号，从 0 开始。
                href,       //原始地址。
                file,       //完整的物理路径。 
                item,       //标签的 html 内容。
                line,       //整一行的 html 内容。
                tabs,       //前导空格数。
                props,     //完整的 html 属性集合。
                link: null,       //file 对应的 HtmlLink 实例，此处先从语义上占位。
            };

        }).filter((item) => { //要过滤一下。
            return !!item;
        });

        return { lines, list, };
    }




    return {

        /**
        * 解析。
        *   options = {
        *       file: '',       //必选。 html 片段文件路径。
        *       content: '',    //可选。 html 片段文件内容。 如果与 file 字段同时指定，则优先取本字段。
        *       regexp: RegExp, //必选，提取出引用了 html 片段文件的标签的正则表达式。
        *   };
        */
        parse({ file, content, regexp, }) {
            //参数中可以同时指定 content 和 file，优先取 content。
            content = content || File.read(file);

            let dir = Path.dir(file);
            let $ = cheerio.load(content);


            //提取出如引用了 html 分文件的 link 标签
            let info = parse(content, { regexp, dir, });


            return {
                '$': $,
                'content': content,
                'dir': dir,
                'lines': info.lines,
                'list': info.list,
            };

        },
    };

});


