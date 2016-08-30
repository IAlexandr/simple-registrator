import aws from 'aws-sdk';
import s3blobs from 's3-blob-store';

const client = new aws.S3({
  accessKeyId: '4I93XTM0WB8UBX73R7J9',
  secretAccessKey: 'qwhS5T6AeMKAktqU2wDWL4wGXLPmhU0Gnf5YAysO',
  endpoint: new aws.Endpoint('http://10.10.10.242:7480'),
});

const store = s3blobs({
  client: client,
  bucket: 'TESTING'
});

export default store;
