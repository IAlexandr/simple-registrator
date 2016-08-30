import xmldoc from 'xmldoc';
import fs from 'fs';
import dg from 'debug';
const debug = dg('manifest-parser');

export default function (mpdPth, callback) {
  const props = {};

  fs.readFile(mpdPth, (err, data) => {
    if (err) {
      return callback(err);
    }
    const xmlString = data.toString();
    const MPD = new xmldoc.XmlDocument(xmlString);
    const {
      minimumUpdatePeriod,
      suggestedPresentationDelay,
      minBufferTime,
      publishTime,
      availabilityStartTime
    } = MPD.attr;
    props.minimumUpdatePeriod = minimumUpdatePeriod;
    props.suggestedPresentationDelay = suggestedPresentationDelay;
    props.minBufferTime = minBufferTime;
    props.availabilityStartTime = availabilityStartTime;
    props.publishTime = publishTime;
    const Period = MPD.childNamed('Period');
    const AdaptationSet = Period.childNamed('AdaptationSet');
    const Representation = AdaptationSet.childNamed('Representation');
    props.Representation = Object.assign({bandwidth:'192000'}, Representation.attr);
    const SegmentTemplate = Representation.childNamed('SegmentTemplate');
    props.SegmentTemplate = {
      timescale: SegmentTemplate.attr.timescale
    };
    return callback(null, props);
  });
}
