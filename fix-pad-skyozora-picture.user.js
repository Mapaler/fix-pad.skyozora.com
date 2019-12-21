// ==UserScript==
// @name         智龙迷城战友网图片修复
// @namespace    http://www.mapaler.com/
// @version      1.0
// @description  把战友网怪物图片替换成镜像
// @author       Mapaler <mapaler@163.com>
// @copyright    2019+, Mapaler <mapaler@163.com>
// @icon         https://pad.skyozora.com/images/egg.ico
// @match        *://pad.skyozora.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const iconRegPattern = '.+photobucket\.com\/.+\/skyozora\/pets_icon\\d*\/(\\d+).+';
    const picRegPattern = '.+photobucket\.com\/.+\/skyozora\/pets_pic\\d*\/(\\d+).+';
    const skillRegPattern = '.+photobucket\.com\/.+\/skyozora\/skill_icon\\d*\/skill\-(\\d+).+';

    function getPicUrl(id, type = 0)
    {
        let url = null;
        switch(type)
        {
            case 0:case 'pets_icon':
                url = `https://f002.backblazeb2.com/file/miru-data/padimages/jp/portrait/${id}.png`;
                break;
            case 1:case 'pets_pic':
                url = `https://f002.backblazeb2.com/file/miru-data/padimages/jp/full/${id}.png`;
                break;
            case 2:case 'skill_icon':
                url = `http://www.puzzledragonx.com/en/img/awokens/${id}.png`;
                break;
        }
        return url;
    }
    var allImg = Array.prototype.slice.call(document.querySelectorAll("img"));
    allImg.forEach(item => {
        let src = item.src;
        //怪物头像
        let iconReg = new RegExp(iconRegPattern,'igm');
        let iconRegRes = iconReg.exec(src);
        let monID = null;
        if (iconRegRes)
        {
            monID = parseInt(iconRegRes[1],10);
            item.src = getPicUrl(monID,0);
        }
        //地下城列表页的怪物头像
        let dataOriginal = item.getAttribute("data-original");
        if (dataOriginal)
        {
            iconReg = new RegExp(iconRegPattern,'igm');
            iconRegRes = iconReg.exec(dataOriginal);
            if (iconRegRes)
            {
                monID = parseInt(iconRegRes[1],10);
                item.setAttribute("data-original",getPicUrl(monID,0));
            }
        }
        //怪物全身
        let picReg = new RegExp(picRegPattern,'igm');
        let picRegRes = picReg.exec(src);
        if (picRegRes)
        {
            monID = parseInt(picRegRes[1],10);
            item.src = getPicUrl(monID,1);
        }
        //觉醒技能
        let skillReg = new RegExp(skillRegPattern,'igm');
        let skillRegRes = skillReg.exec(src);
        if (skillRegRes)
        {
            let skillID = parseInt(skillRegRes[1],10);
            item.src = getPicUrl(skillID,'skill_icon');
        }
    });
})();