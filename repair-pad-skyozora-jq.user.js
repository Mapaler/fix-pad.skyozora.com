// ==UserScript==
// @name		智龙迷城战友网增强
// @namespace	http://www.mapaler.com/
// @version		2.1.2
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
// @resource	icons						https://raw.githubusercontent.com/Mapaler/fix-pad.skyozora.com/master/icons-symbol.svg?v=2.1
//-@resource	icons						http://localhost:8080/icons-symbol.svg?16
// @grant		GM_getResourceText
// @grant		unsafeWindow
// @run-at		document-start
// ==/UserScript==

(function() {
	'use strict';
	const svgNS = "http://www.w3.org/2000/svg"; //svg用的命名空间

	const MutationObserver = unsafeWindow.MutationObserver;

	let mobileMode = /\bmobile\b/i.test(navigator.userAgent);

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
		
		if (!mobileMode) {
			document.styleSheets[0].deleteRule(1);
			document.styleSheets[0].deleteRule(0);
		}
		
		//插入总svg
		const svgText = GM_getResourceText("icons"); //将svg文本读取出来
		const parser = new DOMParser();
		const iconsSvg = parser.parseFromString(svgText, "image/svg+xml"); //转换成svg文档
		const svgDoc = iconsSvg.documentElement;
		svgDoc.setAttribute("class","hide");
		const symbols = Array.from(svgDoc.querySelectorAll('symbol'));
		const [maxWidth, maxHeight] = symbols.reduce(([maxWidth, maxHeight], symble)=>{
			const img = symble.querySelector('image');
			return [
				Math.max(maxWidth, img.width.baseVal.value),
				Math.max(maxHeight, img.height.baseVal.value)
			];
		},[0,0]);

		symbols.forEach(symble=>{
			const img = symble.querySelector('image');
			symble.setAttribute('viewBox', [(maxWidth - img.width.baseVal.value) / -2, (maxHeight - img.height.baseVal.value) / -2, maxWidth, maxHeight].join(" "));
		});

		document.body.insertAdjacentElement("afterbegin", svgDoc); //插入body

		//====去除禁止复制内容的限制====
		unsafeWindow.$('#StageInfo').parent().bind('click cut copy paste', function(event) {
			unsafeWindow.$('#StageInfo').unbind(); //调用jQ自身的去掉绑定
		});
		const styleDom = document.head.appendChild(document.createElement("style"));
		styleDom.textContent = `
* {
	font-family: "Microsoft Yahei", "Microsoft JhengHei", "Source Han Sans", Arial, Helvetica, sans-serif, "Malgun Gothic", "맑은 고딕", "Gulim", AppleGothic !important;
	color: white;
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
	font-family: "FOT-Kurokane Std EB", "Arial Black" !important;
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
		document.title = converterJP2CN(document.title).replace(/^(.+) - (.+) - Puzzle & Dragons 战友系统及资讯网/,'$2 - $1');
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

	SVGSVGElement.prototype.appendSymbleIcon = function(id) {
		const use = document.createElementNS(svgNS,'use');
		use.setAttribute("href",`#i-${id}`);
		this.appendChild(use);
		return use;
	}

	function domAddIcon(dom)
	{
		//创建svg图标引用的svg
		function svgIcon(id) {
			const svg = document.createElementNS(svgNS,'svg');
			svg.setAttribute("class","svg-icon");
			svg.appendSymbleIcon(id);
			return svg;
		}
		function attrIndex(str) {
			switch (str) {
				case '火': return 0;
				case '水': return 1;
				case '木': return 2;
				case '光': return 3;
				case '暗': return 4;
			}
		}
		function typeIndex(str) {
			switch (str) {
				case '进化用': return 0;
				case '平衡': return 1;
				case '体力': return 2;
				case '回复': return 3;
				case '龙': return 4;
				case '神': return 5;
				case '攻击': return 6;
				case '恶魔': return 7;
				case '机械': return 8;
				case '特别保护': return 9;
				case '能力觉醒用': return 12;
				case '强化合成用': return 14;
				case '贩卖用': return 15;
			}
		}

		if (dom.nodeType === Node.TEXT_NODE) {
			let res;
			if (res = /异常状态（如毒、威吓、破防）无效化/.exec(dom.nodeValue)) {
				dom.parentElement.insertBefore(svgIcon('abnormal-state-shield'), dom);
			}
			if (res = /HP在上限\d+%或以上的话，受到致命伤害时，将会以(\d+)(点|%)HP生还/.exec(dom.nodeValue)) {
				const superResolve = res[2] == '%';
				const svg = svgIcon(superResolve ? 'super-resolve' : 'resolve');
				if (superResolve) {
					const text = document.createElementNS(svgNS,'text');
					text.textContent = res[1];
					text.setAttribute("x", "50%");
					text.setAttribute("y", "50%");
					text.setAttribute("fill", "white");
					svg.appendChild(text);
				}
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /单一伤害值.+点以上的伤害(吸收|无效)/.exec(dom.nodeValue)) {
				const svg = svgIcon('shield');
				const frontIcon = svg.appendSymbleIcon(`damage-${res[1]=='吸收'?'absorb':'void'}`);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /将\s*(\d+)COMBO\s*或以下时所造成的伤害全部吸收/.exec(dom.nodeValue)) {
				const svg = svgIcon('combo-absorb');
				svg.appendSymbleIcon('recover');
				const text = document.createElementNS(svgNS,'text');
				text.textContent = res[1];
				text.setAttribute("x", "50%");
				text.setAttribute("y", "50%");
				text.setAttribute("fill", "#F7C");
				svg.appendChild(text);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /受到的(.*)属性伤害减少(\d+)%/.exec(dom.nodeValue)) {
				const all = !Boolean(res[1]);
				const attrs = res[1].split("、");
				for (let i = 0; i < attrs.length; i++) {
					const attr = attrIndex(attrs[i]);
					const svg = svgIcon('shield');
					if (all) {
						const text = document.createElementNS(svgNS,'text');
						text.textContent = res[2];
						text.setAttribute("x", "50%");
						text.setAttribute("y", "50%");
						text.setAttribute("fill", "white");
						svg.appendChild(text);
					} else {
						const frontIcon = svg.appendSymbleIcon(`attr-${attr}`);
						frontIcon.setAttribute('transform', 'scale(0.85) translate(2, 0)');
					}
					dom.parentElement.insertBefore(svg, dom);
				}
			}
			if (res = /由(.+)宠物造成的伤害减少(\d+)%/.exec(dom.nodeValue)) {
				const types = res[1].split(/[、和]/);
				for (let i = 0; i < types.length; i++) {
					const type = typeIndex(types[i].replace(/类$/,''));
					const svg = svgIcon('shield');
					const frontIcon = svg.appendSymbleIcon(`type-${type}`);
					frontIcon.setAttribute('transform', 'scale(0.7) translate(5, 3)');
					dom.parentElement.insertBefore(svg, dom);
				}
			}
			if (res = /将(?:受到的)?(随机)?(.+)属性伤害转换成自己的生命值/.exec(dom.nodeValue)) {
				const random = Boolean(res[1]); //是否随机
				const normalSplit = res[2].includes('、'); //是否是顿号的普通分割
				const attrs = res[2].split(normalSplit ? "、" : "/" );
				for (let i=0;i<attrs.length;i++) {
					let attrStr = attrs[i], attrArr = [];
					let multiReg = /「(.+?)」/mg.exec(attrStr);
					if (multiReg) {
						let str = multiReg[1];
						attrArr = (str.includes('/') ? str.split('/') : Array.from(str)).map(attrIndex);
					} else {
						attrArr.push(attrIndex(attrStr));
					}
					
					attrArr.forEach(attr=>{
						if (random) attr = 'any';
						const svg = svgIcon(`attr-${attr}`);
						svg.appendSymbleIcon('recover');
						dom.parentElement.insertBefore(svg, dom);
					});
					if (multiReg && i<(attrs.length-1)) {
						dom.parentElement.insertBefore(document.createTextNode('/'), dom);
					}
				}
			}
			if (res = /技能的?冷却时间(增加|缩短)/.exec(dom.nodeValue)) {
				const zuo = res[1]=='增加';
				const svg = svgIcon('skill-boost');
				const text = document.createElementNS(svgNS,'text');
				text.textContent = zuo?'-':'+';
				text.setAttribute("x", "80%");
				text.setAttribute("y", zuo?"80%":"20%");
				text.setAttribute("fill", zuo?"lightblue":"yellow");
				text.setAttribute("style", "font-size: 2em;");
				svg.appendChild(text);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /觉醒技能无效化/.exec(dom.nodeValue)) {
				const svg = svgIcon('awoken-bind');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /无法发动任何主动技能/.exec(dom.nodeValue)) {
				const svg = svgIcon('skill-bind');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /封锁.+宠物/.exec(dom.nodeValue)) {
				const svg = svgIcon('member-bind');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /结算时(增加|减少)(\d+)COMBO/.exec(dom.nodeValue)) {
				const decrease = res[1]=='减少';
				const svg = svgIcon(`combo-${decrease?'decrease':'increase'}`);
				const text = document.createElementNS(svgNS,'text');
				text.textContent = res[2];
				text.setAttribute("x", "70%");
				text.setAttribute("y", "40%");
				text.setAttribute("fill", "white");
				svg.appendChild(text);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /(宠物的)?攻击力变成原来的(\d+)%/.exec(dom.nodeValue)) {
				const member = Boolean(res[1]);
				const decrease = Number(res[2])<100;	
				let svg = svgIcon(member ? 'assist-bind' : 'attr-any');
				const frontIcon = svg.appendSymbleIcon(`member-atk-${decrease?'decrease':'increase'}`);
				frontIcon.setAttribute('transform', `scale(0.75) translate(${member ? 4 : 10}, ${member ? 4 : (decrease? 10 : 0)})`);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /回复力变成原来的(\d+)%/.exec(dom.nodeValue)) {
				const decrease = Number(res[1])<100;
				const svg = svgIcon('attr-5');
				const frontIcon = svg.appendSymbleIcon(`member-atk-${decrease?'decrease':'increase'}`);
				frontIcon.setAttribute('transform', `scale(0.75) translate(10, ${decrease? 10 : 0 })`);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /辅助宠物无效化/.exec(dom.nodeValue)) {
				const svg = svgIcon('assist-bind');
				const frontIcon = svg.appendSymbleIcon(`bind`);
				//frontIcon.setAttribute('transform', 'translate(0, 5)');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /宝珠锁定/.exec(dom.nodeValue)) {
				const svg = svgIcon('lock');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /锁定掉落的宝珠/.exec(dom.nodeValue)) {
				const svg = svgIcon('lock');
				svg.appendSymbleIcon(`fall-down`);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /攻击力提升至/.exec(dom.nodeValue)) {
				const svg = svgIcon('angry');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /云遮挡宝珠/.exec(dom.nodeValue)) {
				const svg = svgIcon('cloud');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /无法移动(.+)的宝珠/.exec(dom.nodeValue)) {
				const svg = svgIcon('immobility');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /(掉落|变成)超暗暗/.exec(dom.nodeValue)) {
				const svg = svgIcon('super-dark');
				if (res[1] == '掉落') {
					svg.appendSymbleIcon(`fall-down`);
				}
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /宝珠每隔([\d\.]+)秒不断转换/.exec(dom.nodeValue)) {
				const svg = svgIcon('roulette');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /造成玩家目前HP(\d+)%的伤害/.exec(dom.nodeValue)) {
				const damage = Number(res[1]);
				if (damage < 100) return; //小于100的重力不需要盾
				const fragment = document.createDocumentFragment();
				fragment.append(`（需要`);
				const svg = svgIcon('shield');
				svg.appendSymbleIcon(`text-defense`);
				fragment.append(svg);
				fragment.append(`盾>${Math.round((1-100/Number(res[1]))*10000)/100}%）`);
				dom.parentElement.insertBefore(fragment, dom.nextSibling);
			}
			if (res = /掉落(弱体|强)化宝珠/.exec(dom.nodeValue)) {
				const decline = res[1]=='弱体';
				const svg = svgIcon(`orb-${decline?'decline':'enhance'}`);
				svg.appendSymbleIcon(`fall-down`);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /天降的宝珠不会产生COMBO/.exec(dom.nodeValue)) {
				const svg = svgIcon('no-fall-dowm');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /宝珠起手的位置随机固定/.exec(dom.nodeValue)) {
				const svg = svgIcon('fix-start-position');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /攻击目标被锁定/.exec(dom.nodeValue)) {
				const svg = svgIcon('fix-target');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /宝珠移动时间变成原来的(\d+)%/.exec(dom.nodeValue)) {
				const decrease = Number(res[1])<100;
				const svg = svgIcon(`move-time-${decrease?'decrease':'increase'}`);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /玩家的HP上限/.exec(dom.nodeValue)) {
				const svg = svgIcon('change-max-hp');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /随机将1个队员换成队长/.exec(dom.nodeValue)) {
				const svg = svgIcon('change-leader-position');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /队长会(?:随机)?变成/.exec(dom.nodeValue)) {
				const svg = svgIcon('change-leader-card');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /宝珠盘面变成/.exec(dom.nodeValue)) {
				const svg = svgIcon('board-change-size');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /掉落COMBO宝珠/.exec(dom.nodeValue)) {
				const svg = svgIcon('orb-combo');
				svg.appendSymbleIcon(`fall-down`);
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /随机转换自身的属性|将自身的属性转换成(.)/.exec(dom.nodeValue)) {
				const svg = svgIcon('enemy-attr');
				const attr = res[1] ? attrIndex(res[1]) : 'any';
				const frontIcon = svg.appendSymbleIcon(`attr-${attr}`);
				frontIcon.setAttribute('transform', 'scale(0.85) translate(1, 1)');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /回复玩家(\d+)%HP/.exec(dom.nodeValue)) {
				const svg = svgIcon('heal');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /消除玩家所有BUFF技能效果/.exec(dom.nodeValue)) {
				const svg = svgIcon('bind');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /变成不会受到任何伤害的状态/.exec(dom.nodeValue)) {
				const svg = svgIcon('invincible');
				dom.parentElement.insertBefore(svg, dom);
			}
			if (res = /回到可以承受伤害的状态/.exec(dom.nodeValue)) {
				const svg = svgIcon('invincible');
				dom.parentElement.insertBefore(svg, dom);
				const frontIcon = svg.appendSymbleIcon(`bind`);
				frontIcon.setAttribute('transform', 'translate(0, 5)');
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