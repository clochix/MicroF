/***************************************************************************
 *  Detect micro-formats
 *  
 *  Copyright (C) 2010 by clochix at clochix.net
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
const self    = require("self");
const panels  = require("panel");
const tabs    = require("tabs");
const widgets = require("widget");

/**
 * Describe the micro-formats
 * Partially implemented:
 * - hResume
 * - hReview
 * - hCard
 * - hCvent
 */
var uFormats = {
    hresume: ['summary', {name: 'vcard', type: 'vcard'}, {name: 'education', type: 'vevent'}, {name: 'experience', type: ['vevent', 'vcard']}, /*{name: 'skill', attr: 'rel'},*/ {name: 'affiliation', type: 'vcard'}, 'citation'],
    hreview: ['version', 'summary', 'type', {name: 'item', type: ['vcard', 'vevent']}, {name: 'reviewer', type: 'vcard'}, 'dtreviewed', 'rating', 'description' /*,{name: 'tag', attr: 'rel'},*/ ],
    adr: ['post-office-box','extended-address','street-address','locality','region','postal-code','country-name','type','value'],
    email: ['type','value'],
    geo: ['latitude','longitude'],
    vcard: ['fn','name','n1',{name: 'adr', type: 'adr'},'agent','bday','category','class',{name:'email',type:'email'},{name:'geo',type:'geo'},'key','label','logo','mailer','nickname','note','org','affiliation','photo','rev','role','sort-string','sound','tel2','title','tz','uid','url'],
    vevent: ['dtstart','startDate','summary','location','url','dtend','endDate','rdate','rrule','category','eventType','description','uid','geo','attendee','contact','organizer','attach','status']
  };
/**
 * Extract informations from an element and its descendents.
 *
 * e is the parent DOM Element
 * this in this function is an object whith the following properties
 * - name : String : root attribute
 * - props : Array : list of properties avalable in this format
 * - list : Object : to store the result
 * - i : Mixed : current key of the result
 * - multiple : boolean : 
 * - doc : DOM Document : the current document
 */
var extractFunc = function(e){
  var doc    = this.doc;
  var oProps = {};
  var propFunction = function(eProp){
      var txt = eProp.textContent.replace(/\s+/g, ' ').replace(/^\s+/g,'').replace(/\s+$/g,'');
      if (oProps[this.name]){
        oProps[this.name].push(txt === '' ? eProp.innerHTML : txt);
      } else {
        oProps[this.name]=[txt === '' ? eProp.innerHTML : txt];
      }
    };
  this.props.forEach(function(prop){
    var propName;
    switch (typeof prop){
      case 'string':
        propName = prop;
        Array.forEach(e.getElementsByClassName(propName), propFunction, {name: propName});
        break;
      case 'object':
        propName = prop.name;
        if (prop.type) {
          var propType, propMultiple;
          if (typeof prop.type == 'object') {
            propType = prop.type;
            propMultiple = true;
          } else {
            propType = [prop.type];
            propMultiple = false;
          }
          var propList = {};
          var cpt = 0;
          Array.forEach(e.getElementsByClassName(propName), function(innerElmt){
            var div = doc.createElement('div');
            div.appendChild(innerElmt.cloneNode(true));
            oProps[this.name] = [];
            propType.forEach(function(type){
              Array.forEach(div.getElementsByClassName(type), extractFunc, {name: type, props: uFormats[type], list: propList, i: cpt, multiple: propMultiple, doc: doc});
            });
            cpt++;
            oProps[this.name] = propList;
          }, {name: propName});
        }
        break;
      default:
        break;
    }
  });
  if (this.multiple){
    if (!this.list[this.i]){
      this.list[this.i]={};
      this.list[this.i][this.name]=oProps;
    } else {
      this.list[this.i][this.name]=oProps;
    }
  } else {
    this.list[this.i]=oProps;
    this.i++;
  }
};
/**
 * Search for micro-formats in a tab
 *
 * @return Object
 */
var processTab = function(tab){
  var res = {};
  var cpt = 0;
  var doc = tab.contentDocument;
  for (var uFormat in uFormats){
    var nodes = doc.getElementsByClassName(uFormat);
    if (nodes.length > 0)
    {
      res[uFormat] = {};
      Array.forEach(nodes, extractFunc, {name: uFormat, props: uFormats[uFormat], list: res[uFormat], i: cpt, multiple: false, doc: doc});
    }
  }
  return res;
}
/**
 * Main
 */
exports.main = function(options, callbacks) {
  /**
   * The panel for displaying results
   */
  var microPanel = panels.Panel({
      width: 500,
      height: 600,
      contentURL: self.data.url('panel.html'),
      contentScriptURL: [self.data.url("panel.js")],
      onShow: function(){
        microPanel.postMessage(processTab(tabs.activeTab));
      },
      onHide: function(){
      },
      onMessage: function(message) {
      }
    });
  /**
   * The widget
   */
  var microWidget = widgets.Widget({
      label: "Micro-Formats",
      content: "<span></span>",
      panel: microPanel,
    });
  widgets.add(microWidget);
  /**
   * Check if a tab contains some micro-formats
   */
  var inspectTab = function(tab){
    var cpt = 0;
    for (var uFormat in uFormats){
      cpt+= tab.contentDocument.getElementsByClassName(uFormat).length;
    }
    if (cpt > 0){
      microWidget.content = self.data.url("microformat.png");
    } else {
      microWidget.content = "<span></span>";
    }
  }
  tabs.onReady.add(function(tab){
    inspectTab(tab);
  });
  tabs.onActivate.add(function(tab){
    inspectTab(tab);
  });
};
