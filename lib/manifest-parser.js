import xmldoc from 'xmldoc';
import fs from 'fs';
import dg from 'debug';
const debug = dg('manifest-parser');

export default function (mpdPth, callback) {
  const resultMpd = {};

  fs.readFile(mpdPth, (err, data) => {
    if (err) {
      return callback(err);
    }
    const xmlString = data.toString();
    const MPD = new xmldoc.XmlDocument(xmlString);
    resultMpd._attr = MPD.attr;
    const Period = MPD.childNamed('Period');
    resultMpd['Period'] = {attr: Period.attr};
    const AdaptationSet = Period.childNamed('AdaptationSet');
    resultMpd['Period']['AdaptationSet'] = {attr: AdaptationSet.attr};
    const Representation = AdaptationSet.childNamed('Representation');
    resultMpd['Period']['AdaptationSet']['Representation'] = {attr: Object.assign({bandwidth:'192000'}, Representation.attr)};
    const SegmentTemplate = Representation.childNamed('SegmentTemplate');
    resultMpd['Period']['AdaptationSet']['Representation']['SegmentTemplate'] = {attr: SegmentTemplate.attr};
    const SegmentTimeline = SegmentTemplate.childNamed('SegmentTimeline');
    resultMpd['Period']
      ['AdaptationSet']
      ['Representation']
      ['SegmentTemplate']
      ['SegmentTimeline']= [];
    const segArr = [];
    SegmentTimeline.eachChild((child) => {
      const segment = {};
      segment[child.name] = {_attr: child.attr};
      segArr.push(segment);
    });
    resultMpd['Period']
      ['AdaptationSet']
      ['Representation']
      ['SegmentTemplate']
      ['SegmentTimeline'] = segArr;
    // const xmlTag =  document.valueWithPath('type');
    // console.log(xmlTag);
    // const version =  xmlTag.valueWithPath('@version');
    // console.log(version);
    return callback(null, resultMpd);
  });
}
