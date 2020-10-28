
/**
* 验证器。
*/
define('MasterPage/Validater', function (require, module, exports) {
    const $Object = require('@definejs/object');
    
    const Lines = require('Lines');


    return {
        /**
        * 检查 html 内容中的 id 是否存在重复使用。 
        */
        checkIds(html) {
            let regexp = /\s+id\s*=\s*["'][\s\S]*?["']/ig;
            let list = html.match(regexp);

            if (!list) { //没有匹配到 id。
                return;
            }


            let invalid = false;
            let lines = Lines.split(html);
            let id$items = {};

            list.forEach((item) => {
                //如 item 为 ` id="div-main-home"`，具体的 id。
                //如 item 为 ` id="{footerId}"`，用于模板填充的 id。
                let pairs = item.split(/\s+id\s*=\s*/i);
                let id = pairs[1].slice(1, -1);

                //包含 `{` 和 `}`，可能是模板中的 id，忽略掉。
                if (id.includes('{') && id.includes('}')) {
                    return;
                }

                let items = id$items[id] = id$items[id] || [];
                items.push(item);
            });


            $Object.each(id$items, (id, items) => {
                let length = items.length;
                if (length < 2) {
                    return;
                }

                invalid = true;
                length = length.toString();
                console.error('使用重复的 id: ' + id + ' ' + length + ' 次');

                let htmls = [];

                //去重。
                items = [...new Set(items)];

                items.forEach((item) => {

                    lines.forEach((line, no) => {
                        if (!line.includes(item)) {
                            return;
                        }

                        //line = line.trim();
                        line = line.split(id).join(id.bgMagenta); //高亮 id 的值部分。
                        no = no + 1;
                        htmls.push((no + ':').cyan + line);
                    });

                });

                console.log(htmls.join('\r\n'));
                console.log('');

            });

            return invalid;


        },


    };

});


