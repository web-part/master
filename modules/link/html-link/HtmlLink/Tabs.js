/**
* 
*/
define('HtmlLink/Tabs', function (require, module, exports) {
    const $String = require('@definejs/string');

    const Lines = require('Lines');
    const BlockList = require('BlockList');


    return {
        /**
        * 把指定的内容用配对的特殊开始标记和结束标记包裹起来，以便后续进一步处理。
        *   options = {
        *       content: '',    //必选。 要包裹的 html 内容。
        *       origin: 0,      //必选。 内容原始的缩进空格数。
        *       target: 0,      //必选。 被包裹的内容在后续需要缩进的空格数。
        *       file: '',       //可选。 源文件，用增加可读性，以便知道是哪个源文件。
        *   };
        *
        * 如文件 `htdocs/views/add/textarea.html`，内容为：
        *           AAAAAAAAAAAA
        *           BBBBBBBBBBBBBBBBB
        *           CCCCCCCCCCCC

        * 给处理后为：
        *           <!--weber.tabs.begin=4|315C451F8ECB58AB16C52BD80EDC1E9D|htdocs/views/add/textarea.html-->
        *           AAAAAAAAAAAA
        *           BBBBBBBBBBBBBBBBB
        *           CCCCCCCCCCCC
        *           <!--weber.tabs.end=4|315C451F8ECB58AB16C52BD80EDC1E9D|htdocs/views/add/textarea.html-->
        */
        wrap(options) {
            let { origin, target, content, file, } = options;
            let token = $String.random(32);
            let sample = '<!--weber.tabs.{type}={target}|{token}|{file}-->';

            //生成开始标记。
            let begin = $String.format(sample, {
                'type': 'begin',
                'target': target,
                'token': token,
                'file': file,
            });

            //生成结束标记。
            let end = $String.format(sample, {
                'type': 'end',
                'target': target,
                'token': token,
                'file': file,
            });


            //先把开始标记和结束标记跟目标内容的缩进对齐。
            begin = Lines.pad(begin, origin);
            end = Lines.pad(end, origin);

            content = Lines.join([begin, content, end,]);

            return content;
        },

        /**
        * 从指定的内容中分析出配对的特殊的开始标记、结束标记和缩进的空格数，
        * 并将内容进行缩进和替换处理，配对的标记将会给删除掉。
        * 如输入内容为：
        *           <!--weber.tabs.begin=4|315C451F8ECB58AB16C52BD80EDC1E9D|htdocs/views/add/textarea.html-->
        *           AAAAAAAAAAAA
        *           BBBBBBBBBBBBBBBBB
        *           CCCCCCCCCCCC
        *           <!--weber.tabs.end=4|315C451F8ECB58AB16C52BD80EDC1E9D|htdocs/views/add/textarea.html-->
        * 则处理后为：
        *   AAAAAAAAAAAA
        *   BBBBBBBBBBBBBBBBB
        *   CCCCCCCCCCCC
        */
        replace(content) {
            let regexp = /<!--weber.tabs.begin=.+/ig;
            let beginIndex = '<!--weber.tabs.begin='.length;
            let endIndex = 0 - '-->'.length;

            let list = content.match(regexp) || [];


            list.forEach((beginTag) => {
                let value = beginTag.slice(beginIndex, endIndex);
                let endTag = `<!--weber.tabs.end=${value}-->`;

                let items = beginTag.split('|');
                let target = items[0].slice(beginIndex);

                target = Number(target) || 0;    //需要缩进的目标空格数。


                content = BlockList.replace(content, {
                    'begin': beginTag,
                    'end': endTag,

                    'value'(item) {
                        let lines = Lines.split(item.content);

                        lines = lines.map((line) => {
                            let origin = item.tabs;         //源空格数。
                            let count = origin - target;    //需要截取掉的多余空格数。

                            return line.slice(count);
                        });

                        return Lines.join(lines);
                    },
                });
            });

            return content;
        },
    };

});


