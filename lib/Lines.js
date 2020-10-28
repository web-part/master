/**
* 把文本分裂成行的工具。
*/
define('Lines', function (require, module, exports) {
    const $String = require('@definejs/string');
    const Lines = require('@definejs/lines');
    const HintLine = require('@definejs/hint-line');


    return exports = {
        ...Lines,

        /**
        * 在控制台打印指定的片段，并高亮指定的行。
        * 已重载 highlight(lines, no, options);
        * 已重载 highlight(content, no, options);
        * 参数: 
        *   lines: [] || '',        //内容行的数组。 或者直接传字符串内容，会先分裂成行数组。
        *   no: 99,                 //要高亮的行号。
        *   options = {
        *       size: 10,           //高亮的行前后行数，作为上下文进行提示。
        *       color: 'gray',      //上下文的行的颜色。
        *       current: 'bgRed',   //高亮的行的颜色。
        *   };
        */
        highlight: HintLine.highlight,

        /**
        * 判断所在的行是否给注释掉了。
        */
        commented(line, item) {
            return $String.between(line, '<!--', '-->').includes(item);
        },

        /**
        * 统计指定内容中的行数和最大列数。
        */
        stat(content) {
            let lines = exports.split(content);

            let x = 0;
            let y = 0;
            let no = 0;


            lines.forEach( (line, index) => {
                let s = line.trim();        //移除前后空格后。

                if (!s ||                   //没内容。
                    s.startsWith('//') ||   //以 `//` 开始的注释，在单行注释里。
                    s.startsWith('/*') ||   //以 `/*` 开始的注释，在多行注释里。
                    s.startsWith('*')) {    //以 `*` 和 `*/` 开始的注释，在多行注释里。

                    return;
                }


                y++;

                let len = line.length;
                if (len > x) {
                    x = len;
                    no = index;
                }
            });


            return {
                'x': x,             //最长的一行的长度。           
                'y': y,             //有效的行数，即去掉空行、注释行后的行数。
                'y0': lines.length, //原始行数。
                'no': no + 1,       //最最长的一行所在的行号，从 1 开始。
            };
        },


    };


});




