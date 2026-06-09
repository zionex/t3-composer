import React,{useRef} from "react";

export * from './polyfill'
import JSON5 from 'json5'
import { transLangKey } from '@zionex/wingui-core';

Date.prototype.getWeek = function (dowOffset) {
    dowOffset = typeof (dowOffset) == 'number' ? dowOffset : 0;
    let newYear = new Date(this.getFullYear(), 0, 1);
    let day = newYear.getDay() - dowOffset;
    day = (day >= 0 ? day : day + 7);
    let daynum = Math.floor((this.getTime() - newYear.getTime() -
        (this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
    let weeknum;

    if (day < 4) {
        weeknum = Math.floor((daynum + day - 1) / 7) + 1;
        if (weeknum > 52) {
        let nYear = new Date(this.getFullYear() + 1, 0, 1);
        let nday = nYear.getDay() - dowOffset;
        nday = nday >= 0 ? nday : nday + 7;
        weeknum = nday < 4 ? 1 : 53;
        }
    }
    else {
        weeknum = Math.floor((daynum + day - 1) / 7);
    }
    return weeknum;
};

export function generateId() {
    let newDate = new Date();
    let date = newDate.format('yyyyMMddHHmmssms');
    let weekDay = newDate.format('E');
  
    let min = date;
    let max = 99999999999999999;
    let rand = (Math.floor(Math.random() * (max - min + 1))).toString().slice(0, 12);
  
    return weekDay.substr(randomRange(0, 2), 1)
      + date
      + weekDay.substr(randomRange(0, 2), 1)
      + rand
      + weekDay.substr(randomRange(0, 2), 1);
}

const generateRandomString = (num) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < num; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}
  
export const useContentId = (prefix) => {
    const pageId = useRef(null);
    if (pageId.current == null) {
      if (prefix)
        pageId.current = prefix + '-' + generateId();
      else
        pageId.current = generateRandomString(20)
    }
  
    return pageId.current;
  }

  export function createUniqueKey() {
    let jbRandom = Math.floor(Math.random() * 1000000) + 100000;
    return jbRandom;
  }

  
export function convertCamelToSnake(str) {
    return str.replace(/([A-Z])/g, function (x, y) {
      return "_" + y.toLowerCase()
    }).replace(/^_/, "");
  }
  
  function convertCamelToCss(str) {
    return str.replace(/([A-Z])/g, function (x, y) {
      return "-" + y.toLowerCase()
    }).replace(/^_/, "");
  }
  /* Javascript object to style string */
  export function JSonToStyleString(styleObj) {
    const styleString = (
      Object.entries(styleObj).map(([k, v]) => {
        if (CSS.supports(k, v))
          return `${convertCamelToCss(k)}:${v}`
        else
          return ''
      }).join(';')
    );
    return styleString
  }
  
  export function createCSSSelector(selector, style) {
    if (!document.styleSheets) return;
    if (document.getElementsByTagName('head').length == 0) return;
  
    if (!selector.startsWith("."))
      selector = "." + selector;
  
    let styleSheet, mediaType;
  
    if (document.styleSheets.length > 0) {
      for (let i = 0, l = document.styleSheets.length; i < l; i++) {
        if (document.styleSheets[i].disabled)
          continue;
        let media = document.styleSheets[i].media;
        mediaType = typeof media;
  
        if (mediaType === 'string') {
          if (media === '' || (media.indexOf('screen') !== -1)) {
            styleSheet = document.styleSheets[i];
          }
        }
        else if (mediaType == 'object') {
          if (media.mediaText === '' || (media.mediaText.indexOf('screen') !== -1)) {
            styleSheet = document.styleSheets[i];
          }
        }
  
        if (typeof styleSheet !== 'undefined')
          break;
      }
    }
  
    if (typeof styleSheet === 'undefined') {
      let styleSheetElement = document.createElement('style');
      styleSheetElement.type = 'text/css';
      document.getElementsByTagName('head')[0].appendChild(styleSheetElement);
  
      for (let i = 0; i < document.styleSheets.length; i++) {
        if (document.styleSheets[i].disabled) {
          continue;
        }
        styleSheet = document.styleSheets[i];
      }
  
      mediaType = typeof styleSheet.media;
    }
  
    if (mediaType === 'string') {
      for (let i = 0, l = styleSheet.rules.length; i < l; i++) {
        if (styleSheet.rules[i].selectorText && styleSheet.rules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
          styleSheet.rules[i].style.cssText = style;
          return;
        }
      }
      styleSheet.addRule(selector, style);
    }
    else if (mediaType === 'object') {
      let styleSheetLength = (styleSheet.cssRules) ? styleSheet.cssRules.length : 0;
      for (let i = 0; i < styleSheetLength; i++) {
        if (styleSheet.cssRules[i].selectorText && styleSheet.cssRules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
          styleSheet.cssRules[i].style.cssText = style;
          return;
        }
      }
      //console.log('style',style)
      styleSheet.insertRule(selector + '{' + style + '}', 0);
    }
  }
  
  export function deleteCSSSelector(selector) {
    if (!document.styleSheets) return;
    if (document.getElementsByTagName('head').length == 0) return;
  
    if (!selector.startsWith("."))
      selector = "." + selector;
  
    let styleSheet, mediaType;
  
    try {
      if (document.styleSheets.length > 0) {
        for (let i = 0, l = document.styleSheets.length; i < l; i++) {
          if (document.styleSheets[i].disabled)
            continue;
          styleSheet = document.styleSheets[i];
  
          mediaType = typeof styleSheet.media;
  
          if (mediaType === 'string') {
            for (let i = 0, l = styleSheet.rules.length; i < l; i++) {
              if (styleSheet.rules[i].selectorText && styleSheet.rules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
                styleSheet.deleteRule(i);
                return;
              }
            }
          }
          else if (mediaType === 'object') {
            let styleSheetLength = (styleSheet.cssRules) ? styleSheet.cssRules.length : 0;
            for (let i = 0; i < styleSheetLength; i++) {
              if (styleSheet.cssRules[i].selectorText && styleSheet.cssRules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
                styleSheet.deleteRule(i);
                return;
              }
            }
          }
        }
      }
    }
    catch (e) {
      console.log(e);
    }
  }
  
  export function isCSSSelector(selector) {
    if (!document.styleSheets) return false;
    if (document.getElementsByTagName('head').length == 0) return false;
  
    if (!selector.startsWith("."))
      selector = "." + selector;
  
    let styleSheet, mediaType;
  
    if (document.styleSheets.length > 0) {
      for (let i = 0, l = document.styleSheets.length; i < l; i++) {
        if (document.styleSheets[i].disabled)
          continue;
        styleSheet = document.styleSheets[i];
  
        mediaType = typeof styleSheet.media;
  
        if (mediaType === 'string') {
          for (let i = 0, l = styleSheet.rules.length; i < l; i++) {
            if (styleSheet.rules[i].selectorText && styleSheet.rules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
              return styleSheet.rules[i];
            }
          }
        }
        else if (mediaType === 'object') {
          let styleSheetLength = (styleSheet.cssRules) ? styleSheet.cssRules.length : 0;
          for (let i = 0; i < styleSheetLength; i++) {
            if (styleSheet.cssRules[i].selectorText && styleSheet.cssRules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
              return styleSheet.cssRules[i];
            }
          }
        }
      }
    }
    return false;
  }
  
  export function createClass(name, rules) {
    let style = document.createElement('style');
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
    if (!(style.sheet || {}).insertRule)
      (style.styleSheet || style.sheet).addRule(name, rules);
    else
      style.sheet.insertRule(name + "{" + rules + "}", 0);
  }
  
  export function clone(obj) {
    if (obj === null || typeof (obj) !== 'object') {
      return obj;
    }
  
    let copy;
    if (obj instanceof Date) {
      copy = new Date(obj.getTime());
    } else {
      copy = obj.constructor();
    }
  
    for (let attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = clone(obj[attr]);
      }
    }
    return copy;
  }
  
  export function combine() {
    let args = Array.prototype.slice.apply(arguments);
    return function (componentId, operationId, data, serviceCallId) {
      args.forEach(function (func, idx, arr) {
        if (typeof func === 'function') {
          func(componentId, operationId, data, serviceCallId);
        } else {
          console.log(func + ' is not a function')
        }
      });
    };
  }
  
  export function randomRange(n1, n2) {
    return Math.floor((Math.random() * (n2 - n1 + 1)) + n1);
  }
    
  export function getTodayBaseDate(dateString) {
    dateString = dateString.replaceAll(' ', '');
    let patterns = {
      markSplitPattern: /[-,+]/,
      ymdSplitPattern: /[y,M,d]/g,
      yearPattern: /y$/g,
      monthPattern: /M$/g,
      dayPattern: /d$/g
    };
  
    let addProps = {
      addYears: 0,
      addMonths: 0,
      addDays: 0
    };
  
    let dateSplit = dateString.split(patterns.markSplitPattern);
  
    for (let i = 0; i < dateSplit.length; i++) {
      if (dateSplit[i].toUpperCase() !== 'TODAY') {
        let digitsWIthPostfix = dateString.substr(dateString.indexOf(dateSplit[i]) - 1, 1) + dateSplit[i];
        let digits = parseInt(digitsWIthPostfix.split(patterns.ymdSplitPattern)[0]);
  
        if (patterns.yearPattern.test(digitsWIthPostfix)) {
          addProps.addYears = digits;
        } else if (patterns.monthPattern.test(digitsWIthPostfix)) {
          addProps.addMonths = digits;
        } else if (patterns.dayPattern.test(digitsWIthPostfix)) {
          addProps.addDays = digits;
        }
      }
    }
  
    let today = new Date();
    return new Date(today.getFullYear() + addProps.addYears, today.getMonth() + addProps.addMonths, today.getDate() + addProps.addDays);
  }
  
  export function getDateFromDateString(date) {
    let datePattern = /\d{4}-\d{2}-\d{2}/g;
    let todayBasePattern = /^today.*/gi;
    let newDate;
  
    let dateTest = date.match(datePattern);
    let dateTestTBP = date.match(todayBasePattern);
    if (dateTest !== undefined && dateTest !== '' && dateTest.length > 0) {
      let tempDate = new Date(date);
      newDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate());
    } else if (dateTestTBP !== undefined && dateTestTBP !== '' && dateTestTBP.length > 0) {
      newDate = getTodayBaseDate(date);
    }
  
    return newDate;
  }
  
  export function isEmpty(obj) {
    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        return false;
      }
    }
    return JSON5.stringify(obj) === JSON5.stringify({});
  }
  
  export function isDateDayEqual(v, v2) {
  
    const cd1 = typeof v == 'string' ? getDateFromDateString(v) : v;
    const cd2 = typeof v2 == 'string' ? getDateFromDateString(v2) : v2;
    if (cd1 && cd2) {
      if (cd1.getFullYear() == cd2.getFullYear() && cd1.getMonth() == cd2.getMonth() &&
        cd1.getDate() == cd2.getDate())
        return true;
      else
        return false;
    }
    return false;
  }
  
  export function isEquivalent(a, b) {
    let aProps = Object.getOwnPropertyNames(a);
    let bProps = Object.getOwnPropertyNames(b);
  
    if (aProps.length !== bProps.length) {
      return false;
    }
  
    for (let i = 0, len = aProps.length; i < len; i++) {
      let propName = aProps[i];
  
      if (a[propName] !== b[propName]) {
        return false;
      }
    }
  
    return true;
  }
  
  export function isJson(str) {
    try {
      let temp = JSON5.parse(str);
      if (temp instanceof Object || temp instanceof Array) {
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }
  
  export function convertBoolean(target, defaultValue) {
    if (target === null) {
      return defaultValue;
    }
  
    if (typeof target === 'boolean') {
      return target;
    }
  
    if (typeof target === 'string') {
      let targetString = target.trim().toUpperCase();
      if (targetString.length === 0) {
        return false;
      }
  
      return !('N' === targetString || 'NO' === targetString || 'F' === targetString
        || 'FALSE' === targetString || 'OFF' === targetString || '0' === targetString);
    }
  
    if (typeof target === 'number') {
      let targetNumber = parseInt(target);
  
      return 0 !== targetNumber;
    }
  
    return defaultValue;
  }
  
  export function toBoolean(target) {
    return convertBoolean(target, false);
  }
  
  export function removeClassByPrefix(node, prefix) {
    let regx = new RegExp('\\b' + prefix + '[^ ]*[ ]?\\b', 'g');
    node.className = node.className.replace(regx, '');
    return node;
  }
  
 
  export function getBrowserSize() {
    let size = {}
  
    size.left = window.screenLeft;
    size.top = window.screenTop;
    size.outerWidth = window.outerWidth;
    size.outerHeight = window.outerHeight;
    size.innerWidth = window.innerWidth || document.body.clientWidth
    size.innerHeight = window.innerHeight || document.body.clientHeight
  
    return size;
  }
  
  export function getLastDayOfMonth(date) {
    let lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return lastDayOfMonth;
  }
  export function getFirstDayOfMonth(date) {
    let firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDayOfMonth
  }
  
  export const onErrorInput = (errors, e) => {
    if (typeof errors !== "undefined" && Object.keys(errors).length > 0) {
      $.each(errors, function (key, value) {
        showMessage(transLangKey('WARNING'), `[${value.ref.name}] ${value.message}`);
        return false;
      });
    }
  }
  
  export function traceLog() {
    if (typeof console != "undefined" && console.log) {
      if (console.log.apply) {
        console.log.apply(console, arguments);
      } else {
        var output = '';
        for (let i = 0; i < arguments.length; i++) {
          output += arguments[i] + ' ';
        }
        console.log(output);
      }
    }
  }
  
  export async function copyTextToClipboard(text) {
    if ('clipboard' in navigator) {
      return await navigator.clipboard.writeText(text);
    } else {
      return document.execCommand('copy', true, text);
    }
  }
  
  export async function readFromClipboard() {
    let text = '';
    if ('clipboard' in navigator)
      text = await navigator.clipboard.readText();
  
    return text;
  }
  
  export function createIcon(iconName) {
    let iconNode = <></>
    if (Icon[iconName] !== undefined) {
      iconNode = React.createElement(Icon[iconName], { size: "18" })
    }
    return iconNode
  }
  

  function replaceNaNWithNull(obj) {
    if (Array.isArray(obj)) {
        // 배열인 경우 각 요소에 대해 재귀적으로 처리
        return obj.map(replaceNaNWithNull);
    } else if (obj !== null && typeof obj === 'object') {
        // 객체인 경우 각 키에 대해 재귀적으로 처리
        for (let key in obj) {
            obj[key] = replaceNaNWithNull(obj[key]);
        }
        return obj;
    } else if (typeof obj === 'number' && isNaN(obj)) {
        // NaN을 null로 변환
        return null;
    } else {
        return obj;
    }
}


export function isSuccess(res) {
  if(typeof res =='object') {
    if(res.INFO?.RESULT_MESSAGE == false)
      return false
  }
  else {
    return true
  }
}

export function formatDate(date, format) {
    const d = new Date(date);

    const map = {
        yyyy: d.getFullYear(),
        MM: String(d.getMonth() + 1).padStart(2, '0'), // 월은 0부터 시작하므로 +1
        dd: String(d.getDate()).padStart(2, '0'),
        HH: String(d.getHours()).padStart(2, '0'),
        mm: String(d.getMinutes()).padStart(2, '0'),
        ss: String(d.getSeconds()).padStart(2, '0')
    };

    return format.replace(/yyyy|MM|dd|HH|mm|ss/g, (match) => map[match]);
}

export function isDeepEqual(obj1, obj2) {
  if (!obj1 || !obj2 || typeof obj1 !== "object" | typeof obj2 !== "object") {
    return false
  }

  if (JSON5.stringify(obj1) === JSON5.stringify(obj2))
    return true;
  else
    return false;
}

export function isDeepOrderlessEqual(obj1, obj2,excludeKeys = []) {
  if (obj1 === obj2) return true; // 같은 참조면 true
  if (!obj1 || !obj2 || typeof obj1 !== "object" || typeof obj2 !== "object") {
    return false; // null, undefined, 또는 객체가 아니면 false
  }

  const keys1 = Object.keys(obj1).filter((key) => !excludeKeys.includes(key)).sort();
  const keys2 = Object.keys(obj2).filter((key) => !excludeKeys.includes(key)).sort();

  if (keys1.length !== keys2.length) return false;

  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) return false;

    const key = keys1[i];
    if (!isDeepOrderlessEqual(obj1[key], obj2[key], excludeKeys)) {
      return false;
    }
  }

  return true;
}

export const deepClone = (obj) => {
  // Check if the value is not an object or null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle Array
  if (Array.isArray(obj)) {
    return obj.map(deepClone);
  }

  // Handle Object
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }

  return clonedObj;
};

export function isPromise(value) {
  return Boolean(value && typeof value.then === 'function');
}

export const formatComma = (str) => {
  str = String(str);
  return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, "$1,");
};

export function formatString(formatted) {
  for (let arg in arguments) {
    if (arg == 0)
      continue;
    let idx = arg - 1
    formatted = formatted.replace("{" + idx + "}", arguments[arg]);
  }
  return formatted;
}


export function setPublicDragData(dataTransfer, PREFIX, data) {
  const json = JSON5.stringify(data);
  let encoded = '';
  for (let i = 0; i < json.length; i++) {
    encoded += json.charCodeAt(i).toString(16).padStart(2, '0');
  }
  dataTransfer.setData(`${PREFIX}${encoded}`, '');
}

export function getPublicDragData(dataTransfer, PREFIX) {
  for (const type of dataTransfer.types) {
    if (type.startsWith(PREFIX)) {
      const encoded = type.slice(PREFIX.length);
      let json = '';
      for (let i = 0; i < encoded.length; i += 2) {
        json += String.fromCharCode(parseInt(encoded.slice(i, i + 2), 16));
      }
      return JSON5.parse(json);
    }
  }
}

export function reactComponentHasProps(rectObj, propName) {
  if (rectObj && typeof rectObj == 'object' && React.isValidElement(rectObj) && rectObj.type) {
    if (rectObj.type.propTypes && rectObj.type.propTypes[propName])
      return true;
  }
  return false;
}


export function isDate(value) {
  // 1. 값이 Date 객체인지 확인
  if (Object.prototype.toString.call(value) === '[object Date]') {
    // 2. 유효한 날짜인지 확인
    return !isNaN(value.getTime());
  }
  
  // 3. 문자열인 경우 Date로 변환 후 검사
  if (typeof value === 'string') {
    const parsedDate = new Date(value);
    return !isNaN(parsedDate.getTime());
  }
  
  return false; // Date 객체도 아니고 변환도 실패한 경우
}

// 문자열 숫자로 숫자로 인식하도록
export function isNumeric(value) {
  return !isNaN(value) && !isNaN(parseFloat(value));
}

export function getRandomSamples(data, sampleSize) {
  const totalSize = data.length;
  const sampledIndices = new Set();

  // 랜덤한 고유 인덱스를 뽑아낸다.
  while (sampledIndices.size < sampleSize && sampledIndices.size < totalSize) {
    const randomIndex = Math.floor(Math.random() * totalSize);
    sampledIndices.add(randomIndex);
  }

  // 고유 인덱스 기반으로 샘플 데이터 생성
  return Array.from(sampledIndices).map(index => data[index]);
}

// 균등 분포 샘플링
export function stratifiedSampling(data, sampleSize) {
  const stride = Math.max(1, Math.floor(data.length / sampleSize));
  return data.filter((_, index) => index % stride === 0).slice(0, sampleSize);
}


// 참조를 유지한 채 특정 키만 삭제
function deleteKeys(obj, keysToDelete) {
  keysToDelete.forEach(key => {
      if (key in obj) {
          delete obj[key];
      }
  });
}

// 특정 키를 제외하거나 특정 키만 포함해서 
export function filterKeys(obj, keys, include = true) {
  const keysToDelete = Object.keys(obj).filter(key => include ? !keys.includes(key) : keys.includes(key));
  deleteKeys(obj, keysToDelete);

  if(obj.react_flow_node) {
    
    // 영향을 줄 수 있는 react_flow_node 속성 삭제
    delete obj.react_flow_node.selectable
    delete obj.react_flow_node.dragging
    delete obj.react_flow_node.selected
    delete obj.react_flow_node.positionAbsolute
    delete obj.react_flow_node.measured //로딩된 뒤 다시 계산되어 진다.
  }

  // link 관련 수정에 따른 기존 데이터 보정 시작
  if(!obj.link_map) {
    obj.link_map=[]
  }
  //source_name, target_name 이 있으면 link_map에 추가하자. 
  if(obj.source_name && obj.target_name) {
    const existingLink = obj.link_map.find(item=>item.source_name === obj.source_name && item.target_name === obj.target_name)
    if(!existingLink) {
      obj.link_map.push({source_name: obj.source_name, target_name: obj.target_name}) 
    }
  }
  else if(obj.source_name) {
    
    const existingNode = obj.link_map.find(item=>item.name === obj.source_name && !item.target_name)
    if(!existingNode) {
      obj.link_map.push({source_name: obj.source_name, target_name: null})
    }
  }
  else if(obj.target_name) {
    const existingNode = obj.link_map.find(item=>item.name === obj.target_name && !item.source_name)
    if(!existingNode) {
      obj.link_map.push({source_name: null, target_name: obj.target_name})
    } 
  }

  if(obj.react_flow_edge) {
    obj.react_flow_edge.sourceHandle= `${obj.react_flow_edge.source}_source`
    obj.react_flow_edge.targetHandle= `${obj.react_flow_edge.target}_target`
  }
  delete obj.source_name
  delete obj.target_name

  // link 관련 수정에 따른 기존 데이터 보정 끝

  return obj
}

function updateHandles(handles, oldId, newId) {
  return handles.map(handle => handle.replace(new RegExp(`^${oldId}`), newId));
}

function updateNodeAndEdges(node, edges) {
  const oldId = node.id;
  const newId = generateNewId();

  // Update node ID and related fields
  node.id = newId;
  node.react_flow_node.id = newId;

  // Update input and output handles
  node.react_flow_node.data.input_handle = updateHandles(node.react_flow_node.data.input_handle, oldId, newId);
  node.react_flow_node.data.output_handle = updateHandles(node.react_flow_node.data.output_handle, oldId, newId);

  // Update edges
  edges.forEach(edge => {
      if (edge.from === oldId) {
          edge.from = newId;
          edge.react_flow_edge.source = newId;
          edge.react_flow_edge.sourceHandle = edge.react_flow_edge.sourceHandle.replace(new RegExp(`^${oldId}`), newId);
      }
      if (edge.to === oldId) {
          edge.to = newId;
          edge.react_flow_edge.target = newId;
          edge.react_flow_edge.targetHandle = edge.react_flow_edge.targetHandle.replace(new RegExp(`^${oldId}`), newId);
      }
  });

  return { node, edges };
}

export const updateNodeAndEdgeIds = (nodes, edges) => {
  const idMap = new Map();
    
    // Generate new IDs for each node
    nodes.forEach(node => {
        idMap.set(node.id, generateId());
    });

    // Update nodes
    nodes.forEach(node => {
        const oldId = node.id;
        const newId = idMap.get(oldId);
        node.id = newId;
        node.react_flow_node.id = newId;
        node.react_flow_node.data.input_handle = updateHandles(node.react_flow_node.data.input_handle, oldId, newId);
        node.react_flow_node.data.output_handle = updateHandles(node.react_flow_node.data.output_handle, oldId, newId);

        if(node.parentId) {
          node.parentId = idMap.get(node.parentId);
          node.react_flow_node.parentId = node.parentId
        }
    });

    // Update edges
    edges.forEach(edge => {
      edge.id = generateId()
      edge.react_flow_edge.id = edge.id
      
      if (idMap.has(edge.from)) {
          const oldFrom = edge.from;
          edge.from = idMap.get(edge.from);
          edge.react_flow_edge.source = edge.from;
          edge.react_flow_edge.sourceHandle = edge.react_flow_edge.sourceHandle.replace(new RegExp(`^${oldFrom}`), edge.from);
      }
      if (idMap.has(edge.to)) {
        const oldTo = edge.to;
          edge.to = idMap.get(edge.to);
          edge.react_flow_edge.target = edge.to;
          edge.react_flow_edge.targetHandle = edge.react_flow_edge.targetHandle.replace(new RegExp(`^${oldTo}`), edge.to);
      }
    });

    // console.log(nodes, edges)
    return [ nodes, edges ];
}

export const hasCycle = (edges, newEdge) => {
  const adjacencyList = {};

  // 에지 리스트를 인접 리스트로 변환
  edges.forEach((edge) => {
    if (!adjacencyList[edge.source]) adjacencyList[edge.source] = [];
    adjacencyList[edge.source].push(edge.target);
  });

  // 새 에지를 추가
  if (!adjacencyList[newEdge.source]) adjacencyList[newEdge.source] = [];
  adjacencyList[newEdge.source].push(newEdge.target);

  // DFS로 순환 확인
  const visited = new Set();
  const stack = new Set();

  const dfs = (node) => {
    if (stack.has(node)) return true; // 순환 발견
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    if (adjacencyList[node]) {
      for (const neighbor of adjacencyList[node]) {
        if (dfs(neighbor)) return true;
      }
    }

    stack.delete(node);
    return false;
  };

  // 모든 노드에서 DFS 수행
  return Object.keys(adjacencyList).some((node) => dfs(node));
};



export function getISOWeekNumber(targetDate) {
  let target = new Date(targetDate);
  let startOfWeek = getAppSettings('component').datetime.weekStartsOn
  let dayNr = (targetDate.getDay() + 7 - startOfWeek) % 7;

  target.setDate(target.getDate() - dayNr + 3);

  let firstThursday = target.valueOf();

  target.setMonth(0, 1);

  if (target.getDay() != 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }

  return 1 + Math.ceil((firstThursday - target) / 604800000);
}


export function generateNaturalName(prefix = '') {
  // 샘플 단어 리스트 (원하는 단어 추가 가능)
  const wordList = [
      '잔잔한파도',
      '고요한호수',
      '바람소리',
      '꽃향기',
      '하얀눈',
      '노을빛',
      '은하수',
      '별자리',
      '산속길',
      '푸른언덕',
      '구름다리',
      '초여름',
      '겨울바람',
      '여름소나기',
      '가을단풍',
      '고운모래',
      '반짝이는별',
      '달맞이꽃',
      '맑은샘물',
      '푸른하늘',
      '깊은바다',
      '바다안개',
      '바람부는언덕',
      '햇살가득',
      '고요한아침',
      '산속오솔길',
      '들꽃향기',
      '비오는숲',
      '푸른산',
      '달빛아래',
      '흐르는강물',
      '숲속바람',
      '바다갈매기',
      '하얀파도',
      '파란하늘',
      '산들바람',
      '고운햇살',
      '구름속햇살',
      '별헤는밤',
      '따스한햇살',
      '가을들녘',
      '초록빛들판',
      '깊은숲속',
      '밤하늘',
      '은빛강',
      '푸른호수',
      '들녘바람',
      '봄꽃향기',
      '여름해변',
      '가을들판',
      '겨울산',
      '하얀구름',
      '바다소리',
      '노란꽃',
      '푸른들녘',
      '산속물소리',
      '바람숲길',
      '잔잔한호수',
      '깊은물',
      '고요한별밤',
      '파란산',
      '달빛강',
      '구름위햇살',
      '별가득밤하늘',
      '봄빛들판',
      '여름햇살',
      '가을바람',
      '겨울눈길',
      '맑은바람',
      '별빛강물',
      '바다빛',
      '산속풍경',
      '숲속오솔길',
      '고운하늘',
      '잔잔한강물',
      '맑은구름',
      '산속별빛',
      '바람부는들판',
      '노란들꽃',
      '푸른초원',
      '별빛잔잔한밤',
      '산속햇살',
      '강물흐름',
      '초록산',
      '파도소리',
  ];

  // 랜덤 단어 선택
  const randomWord = wordList[Math.floor(Math.random() * wordList.length)];

  // 랜덤 숫자 추가
  const randomNumber = Math.floor(Math.random() * 100);

  // 이름 생성 (prefix는 선택 사항)
  return `${prefix}_${randomWord}_${randomNumber}`;
}


export const isEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;




function dateComparator(date1, date2) {
  var date1Number = new Date(date1);
  var date2Number = new Date(date2);

  if (date1Number === null && date2Number === null) {
    return 0;
  }
  if (date1Number === null) {
    return -1;
  }
  if (date2Number === null) {
    return 1;
  }

  return date1Number - date2Number;
}


// AgGrid와 유사 포맷
export function convertToDataGridColumn(columns, options = {}) {
  const {
    dateFormat = 'yyyy-MM-dd',
    numberFormat = '1,000.00'
  } = options;

  return columns?.map(col => {
    // 기본 칼럼 설정
    const column = {
      field: col.name,
      headerName: transLangKey(col.headerText),
      headerClass: 'text-center',
      hide: !col.visible,
      editable: col.editable,
      width: col.width,
      cellDataType:'text', // ag grid에서 제공하는 cellDataType: 'text', 'number', 'boolean', 'date', 'dateString', 'object'
      resizable: true,
      sortable: true,
    };

    // 텍스트 정렬 설정
    if (col.textAlignment) {
      column.cellStyle = { textAlign: col.textAlignment };
      column.headerClass = `ag-header-cell-${col.textAlignment}`;
    }

    // 데이터 타입별 설정
    switch (col.dataType.toLowerCase()) {
      case 'number':
        column.type = 'numericColumn';
        column.cellDataType = 'number'
        column.filter = 'agNumberColumnFilter';
        column.valueFormatter = params => {
          if (params.value == null) return '';
          return params.value.toLocaleString();
        };
        break;

      case 'date':
      case 'datetime':
        column.cellDataType = 'date',
        column.comparator= dateComparator,
        column.filter = 'agDateColumnFilter';
        column.valueFormatter = params => {
          if (!params.value) return '';
          return formatDate(new Date(params.value), dateFormat)
        };
        // 날짜 편집을 위한 설정
        if (col.editable) {
          column.cellEditor = 'agDateInput';
          column.cellEditorParams = {
            // input type="date" 형식으로 변환
            parseValue: value => {
              if (!value) return '';
              return new Date(value).toISOString().split('T')[0];
            }
          };
        }
        break;

      case 'boolean':
        column.cellDataType = 'boolean'
        column.cellRenderer = params => {
          return params.value ? '✓' : '✗';
        };
        column.filter = 'agSetColumnFilter';
        // 체크박스 편집을 위한 설정
        if (col.editable) {
          column.cellEditor = 'agCheckboxCellEditor';
          column.cellEditorParams = {
            useFormatter: true
          };
        }
        break;

      default: // string 등 기타 타입
        column.filter = 'agTextColumnFilter';
        break;
    }

    return column;
  });
}

// Base64 인코딩/디코딩 유틸리티 함수
export const base64Utils = {
  encode: (str) => {
    // UTF-8 문자열을 바이트로 변환 후 base64 인코딩
    return btoa(unescape(encodeURIComponent(str)));
  },
  
  decode: (base64Str) => {
    // base64 디코딩 후 UTF-8 문자열로 변환
    return decodeURIComponent(escape(atob(base64Str)));
  }
};



// 메뉴 트리 구조 생성
export const buildMenuTree = (menus) => {
    const menuMap = {}
    const rootMenus = []

    // 먼저 모든 메뉴를 맵에 저장
    menus.forEach(menu => {
      menuMap[menu.id] = { ...menu, children: [] }
    })

    // 부모-자식 관계 설정
    menus.forEach(menu => {
      if (menu.parent_id && menuMap[menu.parent_id]) {
        menuMap[menu.parent_id].children.push(menuMap[menu.id])
      } else {
        rootMenus.push(menuMap[menu.id])
      }
    })

    return flattenMenuTree(rootMenus)
  }

  // 트리를 평탄화하면서 계층 표시 추가
    const flattenMenuTree = (menus, level = 0) => {
      let result = []
      menus.forEach(menu => {
        result.push({
          ...menu,
          level,
          label: `${'  '.repeat(level)}${transLangKey(menu.menu_cd)}`
        })
        if (menu.children && menu.children.length > 0) {
          result = result.concat(flattenMenuTree(menu.children, level + 1))
        }
      })
      return result
    }


export const buildWidgetTree = (widgets) => {
    const widgetMap = {}
    const rootWidgets = []

    // 먼저 모든 메뉴를 맵에 저장
    widgets.forEach(widget => {
      widgetMap[widget.id] = { ...widget, children: [] }
    })

    // 부모-자식 관계 설정
    widgets.forEach(widget => {
      if (widget.parent_id && widgetMap[widget.parent_id]) {
        widgetMap[widget.parent_id].children.push(widgetMap[widget.id])
      } else {
        rootWidgets.push(widgetMap[widget.id])
      }
    })

    return flattenWidgetTree(rootWidgets)
  }

// 트리를 평탄화하면서 계층 표시 추가
const flattenWidgetTree = (widgets, level = 0) => {
  let result = []
  widgets.forEach(widget => {
    result.push({
      ...widget,
      level,
      label: `${'  '.repeat(level)}${transLangKey(widget.widget_cd)}`
    })
    if (widget.children && widget.children.length > 0) {
      result = result.concat(flattenWidgetTree(widget.children, level + 1))
    }
  })
  return result
}