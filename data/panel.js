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

/**
 * Display the embedded informations into the panel
 */
function display(obj, deep){
  var container = document.createElement('div');
  for (var objKey in obj) {
    switch (typeof obj[objKey]) {
      case 'string':
        var content = document.createElement('p');
        if (isNaN(parseInt(objKey, 10))) {
          var title = document.createElement('em');
          title.appendChild(document.createTextNode(objKey));
          content.appendChild(title);
        }
        content.appendChild(document.createTextNode(obj[objKey]));
        container.appendChild(content);
        break;
      case 'object':
        if (isNaN(parseInt(objKey, 10))) {
          var title = document.createElement('h' + deep);
          title.appendChild(document.createTextNode(objKey));
          container.appendChild(title);
        }
        container.appendChild(display(obj[objKey], deep+1));
        break;
      default:
        break;
    }
  }
  return container;
}

function group(obj){
  var nbChilds = 0;
  for (var objKey in obj) nbChilds++;
  if (nbChilds == 1 && objKey === '0') obj = obj['0'];
  else if (nbChilds > 0) for (var objKey in obj) obj[objKey] = group(obj[objKey]);
  return obj;
}

on('message', function(res){
  document.body.replaceChild(display(res, 1), document.body.firstChild);
});
