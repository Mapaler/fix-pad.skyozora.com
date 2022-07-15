// ==UserScript==
// @name		智龙迷城战友网jQ修复
// @namespace	http://www.mapaler.com/
// @version		1.9.0
// @description	解决无翻墙情况下智龙迷城战友网无法展开详情问题
// @author		Mapaler <mapaler@163.com>
// @copyright	2019+, Mapaler <mapaler@163.com>
// @icon		https://pad.skyozora.com/images/egg.ico
// @match		*://pad.skyozora.com/*
// @resource	jquery						https://lib.baomitu.com/jquery/1.8.3/jquery.min.js
// @resource	opencc-js-data				https://unpkg.com/opencc-js@1.0.4/data.js
// @resource	opencc-js-data.cn2t			https://unpkg.com/opencc-js@1.0.4/data.cn2t.js
// @resource	opencc-js-data.t2cn			https://unpkg.com/opencc-js@1.0.4/data.t2cn.js
// @resource	opencc-js-bundle-browser	https://unpkg.com/opencc-js@1.0.4/bundle-browser.js
// @resource	icons						https://github.com/Mapaler/fix-pad.skyozora.com/raw/master/icons-symbol.svg
// @grant		GM_getResourceText
// @grant		unsafeWindow
// @run-at		document-start
// ==/UserScript==

(function() {
	'use strict';
	const svgNS = "http://www.w3.org/2000/svg"; //svg用的命名空间

	const MutationObserver = unsafeWindow.MutationObserver;

	//监听head的加载，代码来源于 EhTagSyringe
	const headLoaded = new Promise(function (resolve, reject) {
		if(document.head && document.head.nodeName == "HEAD") {
			console.debug("已经有head");
			resolve(document.head);
		}else{
			//监听DOM变化
			let observer = new MutationObserver(function(mutations) {
				for (const mutation of mutations) {
					//监听到HEAD 结束
					if(mutation.target.nodeName === "HEAD") {
						observer.disconnect();
						resolve(mutation.target);
						break;
					}
				}
			});
			observer.observe(document, {childList: true, subtree: true, attributes: true});
		}
	});

	//head加载后添加国内的JQ源
	headLoaded.then(head=>{
		[
			'jquery',
			'opencc-js-data',
			'opencc-js-data.cn2t',
			'opencc-js-data.t2cn',
			'opencc-js-bundle-browser',
		].forEach(resName=>{
			const script = document.createElement("script");
			script.id = resName;
			script.type = "text/javascript";
			script.innerHTML = GM_getResourceText(resName);
			head.appendChild(script);
		});
	});

	//大数字缩短长度
	Number.prototype.bigNumberToString = function() {
		let numTemp = this.valueOf();
		if (!numTemp) return "0";
		const grouping = 1e4;
		const unit = ['', '万', '亿', '兆', '京', '垓'];
		const numParts = [];
		do {
			numParts.push(numTemp % grouping);
			numTemp = Math.floor(numTemp / grouping);
		} while (numTemp > 0 && numParts.length < (unit.length - 1))
		if (numTemp > 0) {
			numParts.push(numTemp);
		}
		let numPartsStr = numParts.map((num, idx) => {
			if (num > 0) {
				return (num < 1e3 ? "零" : "") + num + unit[idx];
			} else {
				return "零";
			}
		});

		numPartsStr.reverse(); //反向
		let outStr = numPartsStr.join("");
		outStr = outStr.replaceAll(/(^零+|零+$)/g, ''); //去除开头和末尾的零
		outStr = outStr.replaceAll(/零{2,}/g, '零'); //去除多个连续的零
		return outStr;
	}
	
	const bootstrap = function(){
		document.styleSheets[0].deleteRule(1);
		document.styleSheets[0].deleteRule(0);
		
		//插入总svg
		const svgText = GM_getResourceText("icons"); //将svg文本读取出来
		const parser = new DOMParser();
		const iconsSvg = parser.parseFromString(svgText, "image/svg+xml"); //转换成svg文档
		const svgDoc = iconsSvg.documentElement;
		svgDoc.setAttribute("class","hide");
		const iconsImgs = Array.from(svgDoc.childNodes);
		for (let img of iconsImgs)
		{
			const symbol = iconsSvg.createElementNS(svgNS, 'symbol');
			symbol.id = 'symbol-' + img.id;
			/*const transformBaseVal = img?.transform?.baseVal;
			let iX = 0, iY =0;
			if (transformBaseVal.numberOfItems) {
				try {
					const translate = transformBaseVal?.getItem("translate");
					iX = translate?.matrix?.e;
					iY = translate?.matrix?.f;
				} catch (error) {
					
				}
			}
			symbol.setAttribute('viewBox', [iX, iY, img.width.baseVal.value, img.height.baseVal.value].join(" "));*/
			symbol.setAttribute('viewBox', [0, 0, 34, 34].join(" "));
			img.removeAttribute('id');
			symbol.appendChild(img);
			svgDoc.appendChild(symbol);
		}
		document.body.insertAdjacentElement("afterbegin", svgDoc); //插入body

		//====去除禁止复制内容的限制====
		unsafeWindow.$('#StageInfo').parent().bind('click cut copy paste', function(event) {
			unsafeWindow.$('#StageInfo').unbind(); //调用jQ自身的去掉绑定
		});
		const styleDom = document.head.appendChild(document.createElement("style"));
		styleDom.textContent = `
* {
	font-family: "Microsoft Yahei", "Microsoft JhengHei", "Source Han Sans", Arial, Helvetica, sans-serif, "Malgun Gothic", "맑은 고딕", "Gulim", AppleGothic;
}
body {
	background:#222 ;
}
.hide {
	display: none;
	postion: absolute;
}
.svg-icon {
	width: 2em;
	height: 2em;
	vertical-align: text-bottom;
}
.svg-icon text {
	font-family: "FOT-Kurokane Std EB", "Arial Black";
	font-size: 1.1em;
	font-weight: bold;
	text-shadow: 0 0 1px black,1px 1px 1px black,-1px -1px 1px black;
    text-anchor: middle;
    /* 文本水平居中 */
    dominant-baseline: middle;
    /* 文本垂直居中 */
}
`;

		//====转简体====
		// 将日文汉字转换为简体中文（中国大陆）
		const converterJP2CN = OpenCC.Converter({ from: 'jp', to: 'cn' });
		document.title = converterJP2CN(document.title);
		// 将繁体中文（香港）转换为简体中文（中国大陆）
		const converterHK2CN = OpenCC.Converter({ from: 'hk', to: 'cn' });
		// 设置转换起点为根节点，即转换整个页面
		const rootNode = document.documentElement;
		document.body.lang = 'zh-HK';
		// 将所有 zh-HK 标签转为 zh-CN 标签
		const HTMLConvertHandler = OpenCC.HTMLConverter(converterHK2CN, rootNode, 'zh-HK', 'zh-CN');
		HTMLConvertHandler.convert(); // 开始转换  -> 汉语

		//====大数字加上中文字符====
		//地下城页面
		if (/^\/stage\//.test(location.pathname))
		{
			const stageTitle = document.body.querySelector("#StageInfo>h2");
			if (stageTitle)
			{
				stageTitle.lang = 'jp';
				const HTMLConvertHandler = OpenCC.HTMLConverter(converterJP2CN, stageTitle, 'jp', 'zh-CN');
				HTMLConvertHandler.convert(); // 开始转换  -> 汉语
			}

			const stageDetail = document.body.querySelector("#StageInfo>table:nth-of-type(2)");
			if (stageDetail)
			{
				//HP和防御条
				const centerRows = stageDetail.tBodies[0].querySelectorAll(":scope>tr[align=\"center\"]:not(:first-child)");
				for (let tr of centerRows)
				{
					let tds = tr.querySelectorAll(":scope>td:not([rowspan])");
					if (tds.length>5)
					{
						domBigNumToString(tds[0]); //血量
						domBigNumToString(tds[3]); //攻击
						domBigNumToString(tds[5]); //防御
					}
				}

				//先制数字
				const leftRows = stageDetail.tBodies[0].querySelectorAll(":scope>tr[align=\"left\"]");
				for (let tr of leftRows)
				{
					let skillNames = tr.querySelectorAll(":scope .skill");
					for (let skillName of skillNames) {
						if (skillName.nextSibling) {
							domBigNumToString(skillName.nextSibling);
							domAddIcon(skillName.nextSibling);
						}
					}

					//伤害数字
					let skillDamages = tr.querySelectorAll(":scope .skill_demage");
					for (let skillDamage of skillDamages)
					{
						domBigNumToString(skillDamage);
					}
				}
			}
			//直接打开所有隐藏内容
			Array.from(document.body.querySelectorAll("[onclick^=open_]")).forEach(i=>i.click());
		}
		//新闻页面，主要是针对于8人本页面
		if (/^\/news\//.test(location.pathname))
		{
			const contentTables = Array.from(document.body.querySelectorAll(".content>table"));
			for (let table of contentTables)
			{
				const rows = Array.from(table.rows).slice(1);
				for (let tr of rows)
				{
					domBigNumToString(tr.cells[1]);
				}
			}
		}
	}

	function domBigNumToString(dom)
	{
		const regOriginal = /\b-?\d+(?:,\d{3})*\b/g;

		if (dom.nodeType === Node.TEXT_NODE) {
			textNodeConvertNumber(dom);
		} else {
			let nodes = Array.from(dom.childNodes);
			nodes = nodes.filter(node=>node.nodeType === Node.TEXT_NODE);
			for (let textNode of nodes)
			{
				textNodeConvertNumber(textNode);
			}
		}
		//在纯文本node内转换数字
		function textNodeConvertNumber(textNode) {
			textNode.nodeValue = textNode.nodeValue.trim()
				.replace(new RegExp(regOriginal), match=>{
					return parseInt(match.replaceAll(",",""), 10).bigNumberToString();
				});
		}
	}

	function domAddIcon(dom)
	{
		//创建svg图标引用的svg
		function svgIcon(id) {
			const svg = document.createElementNS(svgNS,'svg');
			svg.setAttribute("class","svg-icon");
			const use = document.createElementNS(svgNS,'use');
			use.setAttribute("href",`#${id}`);
			svg.appendChild(use);
			return svg;
		}
		if (dom.nodeType === Node.TEXT_NODE) {
			let res;
			if (res = /异常状态（如毒、威吓、破防）无效化/.exec(dom.nodeValue)) {
				dom.parentElement.insertBefore(svgIcon('symbol-状态盾'), dom);
			}
			if (res = /将会以1点HP生还/.exec(dom.nodeValue)) {
				dom.parentElement.insertBefore(svgIcon('symbol-根性'), dom);
			}
			if (res = /将会以(\d+)%HP生还/.exec(dom.nodeValue)) {
				const svg = svgIcon('symbol-超根性');
				const text = document.createElementNS(svgNS,'text');
				text.textContent = res[1];
				text.setAttribute("x", "50%");
				text.setAttribute("y", "50%");
				text.setAttribute("fill", "white");
				svg.appendChild(text);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /单一伤害值.+点以上的伤害(吸收|无效)/.exec(dom.nodeValue)) {
				const svg = svgIcon('symbol-盾');
				const use = document.createElementNS(svgNS,'use');
				use.setAttribute("href",`#symbol-伤害${res[1]}`);
				svg.appendChild(use);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /将\s*(\d+)COMBO\s*或以下时所造成的伤害全部吸收/.exec(dom.nodeValue)) {
				const svg = svgIcon('symbol-连击吸收');
				const use = document.createElementNS(svgNS,'use');
				use.setAttribute("href",`#symbol-回复`);
				use.setAttribute("transform",`translate(0 5)`);
				svg.appendChild(use);
				const text = document.createElementNS(svgNS,'text');
				text.textContent = res[1];
				text.setAttribute("x", "50%");
				text.setAttribute("y", "50%");
				text.setAttribute("fill", "#F7C");
				svg.appendChild(text);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /受到的属性伤害减少(\d+)%/.exec(dom.nodeValue)) {
				const svg = svgIcon('symbol-盾');
				const text = document.createElementNS(svgNS,'text');
				text.textContent = res[1];
				text.setAttribute("x", "50%");
				text.setAttribute("y", "50%");
				text.setAttribute("fill", "white");
				svg.appendChild(text);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /将受到的(.+)属性伤害转换成自己的生命值/.exec(dom.nodeValue)) {
				const attrs = res[1].split("、");
				for (const attr of attrs) {
					const svg = svgIcon(`symbol-${attr}`);
					const use = document.createElementNS(svgNS,'use');
					use.setAttribute("href",`#symbol-回复`);
					use.setAttribute("transform",`translate(0 5)`);
					svg.appendChild(use);
					dom.parentElement.insertBefore(svg, dom);
				}
			}
			if (res = /受到的(.+)属性伤害减少/.exec(dom.nodeValue)) {
				const attrs = res[1].split("、");
				for (const attr of attrs) {
					const svg = svgIcon('symbol-盾');
					const use = document.createElementNS(svgNS,'use');
					use.setAttribute("href",`#symbol-${attr}`);
					svg.appendChild(use);
					dom.parentElement.insertBefore(svg, dom);
				}
			}
		}
	}

	//加载document后执行启动器
	if (/loaded|complete/.test(document.readyState)){
		bootstrap();
	}else{
		document.addEventListener('DOMContentLoaded',bootstrap,false);
	}
})();