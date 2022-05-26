
/**
* 通用的分块列表处理工具。
*/
define('BlockList', function (require, module, exports) {
    const Lines = require('Lines');
    const Item = module.require('Item');
    const Patterns = module.require('Patterns');


    return exports = {
        /**
        * 解析。
        * 已重载 parse(lines, opt);   //传入一个行数组作为内容。
        * 已重载 parse(content, opt); //传入一个字符串作为内容。
        *   opt = {
        *       begin: '',          //区块的开始标记。 如 `<!--webpart.less.begin-->`。
        *       end: '',            //区块的结束标记。 如 `<!--webpart.less.end-->`。
        *       type: 'patterns',   //返回结果要解析成的数据类型。 如果指定为 `patterns` 或不指定，则解析成一个路径的模式数组。 
        *   };
        */
        parse(lines, { begin, end, type = 'patterns', }) {
            if (!Array.isArray(lines)) {
                lines = Lines.split(lines);
            }

            let list = [];
            let start = 0;
            let item = null;
            let tags = { begin, end, };


            do {
                item = Item.get(lines, tags, start);

                if (!item) {
                    break;
                }

                start = item.begin + 1;

                //增加一个字段。
                if (type == 'patterns') {
                    item.patterns = Patterns.get(item.lines);
                }

                list.push(item);

            } while (item);


            return list;

        },

        /**
        * 高亮显示指定区块中的某个文件所在的行。
        * 主要用于检测到区块中某个文件不存在时，高亮显示所在的行。
        * 已重载 highlight(lines, item, file);
        * 已重载 highlight(content, item, file);
        * 参数:
        *   lines: [],  //全部内容的行数组。
        *   item: {},   // parse() 方法返回的 list 数组中的项。
        *   file: '',   //短文件名。 如 `index.js`。
        */
        highlight(lines, item, file) {
            let has = item.patterns.includes(file);

            if (!has) {
                return;
            }

            let no = item.lines.findIndex((line) => {
                line = line.trim();

                return line.startsWith("'" + file + "'") ||
                    line.startsWith('"' + file + '"');
            });


            //no 不可能为 0，因为 item.lines[0] 为开始标记。
            if (no < 1) {
                return;
            }


            no = no + item.begin;
            Lines.highlight(lines, no);

        },

        /**
        * 把指定开始标记和结束标记之间的区块替换成指定的内容。
        * 已重载 replace(content, opt);
        * 参数:
        *   content: '',            //要替换的内容。
        *   opt = {
        *       begin: '',          //区块的开始标记。 如 `<!--webpart.html.begin-->`。
        *       end: '',            //区域的结束标记。 如 `<!--webpart.html.end-->`。
        *       value: '' || fn,    //要替换成的内容。
        *   };
        */
        replace(content, { begin, end, value, }) {
            let has = content.includes(begin) && content.includes(end);

            if (!has) {
                return content;
            }

            let lines = Lines.split(content);

            let list = exports.parse(lines, {
                begin,
                end,
                type: 'content',
            });


            list.forEach((item) => {
                let v = value;

                if (typeof v == 'function') {
                    v = v(item);
                }

                Lines.replace(lines, item.begin, item.end, v);
            });

            content = Lines.join(lines);

            return content;

        },
    };

});




