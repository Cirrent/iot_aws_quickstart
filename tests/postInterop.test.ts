import httpStatus from 'http-status';
import request from 'supertest';

import { app } from '../src/app';

const testCert =
  'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUU0VENDQThtZ0F3SUJBZ0lFQ3FPMG9qQU5CZ2txaGtpRzl3MEJBUXNGQURCN01Rc3dDUVlEVlFRR0V3SkUKUlRFaE1COEdBMVVFQ2d3WVNXNW1hVzVsYjI0Z1ZHVmphRzV2Ykc5bmFXVnpJRUZITVJNd0VRWURWUVFMREFwUApVRlJKUjBFb1ZFMHBNVFF3TWdZRFZRUUREQ3RKYm1acGJtVnZiaUJQVUZSSlIwRW9WRTBwSUZSUVRTQXlMakFnClVsTkJJRlJsYzNRZ1EwRWdNVEF3TUNBWERURTRNRGN4TXpFMU1UY3hORm9ZRHprNU9Ua3hNak14TWpNMU9UVTUKV2pCTE1Va3dSd1lEVlFRRkUwQXlPV0UxTWpnNU56QmhNV0ZoWlRNNE9HVmxOR1poT0RrMU1ERm1NVFV5TjJFeApaV1poTURoaU1qa3lPRFEyT1RKa01tSTJZalUyTVdZek1UUXpZV1l5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGCkFBT0NBUThBTUlJQkNnS0NBUUVBdUZyVVdJM0plMTdGNHY0cm1UdDJPbWswOGhIS1JXMEhxTTRJMXZUMnlQZk0KSjdHTnJWNzhQZDVVNUFMNmplV05raXVJYWlQY1BYNkFwQUFVSFgvNThFVzcrOWhKczlYS0QzMk4xN3dkUWVWbgp5WlZWbmhvQ1N4K1g1b01uMzR4U1hnR01CSWNjQVBQWmJ0MHhmc1BFelhFaHNWLzhXSnFKSUsycEVPVDR3YWFkClhLbElvWG1keGtxMUN6ajdTVXRxTEdnMnZIblk5NldDVTlFQ0pHUWpyK2tYaExsQUtKQnRkRkVVY2FRRjlUNEUKeDNUclh3cS9qeWo4U2kyTU9ENkpaOHIxc1BpSmJNYkcwckFxNWk0Z1RKTnNzeEpROE1rbXlvMFZIVWlydXBBTQp1bWpqcUNVKytiNEZSaDlIVkt4MUh1a0hxL1MwR3FNTS9tdmNQa3hjR3dJREFRQUJvNElCbVRDQ0FaVXdXd1lJCkt3WUJCUVVIQVFFRVR6Qk5NRXNHQ0NzR0FRVUZCekFDaGo5b2RIUndPaTh2Y0d0cExtbHVabWx1Wlc5dUxtTnYKYlM5UGNIUnBaMkZTYzJGVWMzUkRRVEV3TUM5UGNIUnBaMkZTYzJGVWMzUkRRVEV3TUM1amNuUXdEZ1lEVlIwUApBUUgvQkFRREFnVWdNRmdHQTFVZEVRRUIvd1JPTUV5a1NqQklNUll3RkFZRlo0RUZBZ0VNQzJsa09qUTVORFkxCk9EQXdNUm93R0FZRlo0RUZBZ0lNRDFOTVFpQTVOamN3SUZSUVRUSXVNREVTTUJBR0JXZUJCUUlEREFkcFpEb3cKTnpVMU1Bd0dBMVVkRXdFQi93UUNNQUF3VUFZRFZSMGZCRWt3UnpCRm9FT2dRWVkvYUhSMGNEb3ZMM0JyYVM1cApibVpwYm1WdmJpNWpiMjB2VDNCMGFXZGhVbk5oVkhOMFEwRXhNREF2VDNCMGFXZGhVbk5oVkhOMFEwRXhNREF1ClkzSnNNQlVHQTFVZElBUU9NQXd3Q2dZSUtvSVVBRVFCRkFFd0h3WURWUjBqQkJnd0ZvQVVxNHF4Y0Q3cnRNaFQKVmFtMS80R0NpT3hBQzlNd0VBWURWUjBsQkFrd0J3WUZaNEVGQ0FFd0lnWURWUjBKQkJzd0dUQVhCZ1ZuZ1FVQwpFREVPTUF3TUF6SXVNQUlCQUFJQ0FJb3dEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBQW12SlFYS2k1d09idFBtCkNLTHRUaFluSFVMQnhnTjQ0aTNwRWJ2dzNWVldjOTZUYmtNRjBXVk9RYk5BYXpUNTN3REdTeVpqRjQ3b2JubmoKRHZxZktrVGt2dkM2UTRHYUkyVFpPWlBYUGwzL2VKTHlkV3gycnpGTGV5MXdhcy85bENGTW5rakxOTDhuOG5GaAo3NjhnTUJFeDNlb0V6bi9DdUVoYWhSWnVqS2ZyVlBIYUtONDUxWXNJZENmL29qWE5QblBENkpPOEVDMnhXU0pRCllaaFo3UGF0R2d2Qjllc0Nodjg3Qkh0a0ZFbzRURGNWTTU1Q3Rmc1JJL29VOXNoZjBPdzhDdWlDT0YyK29QamUKMzhIRlQ5K3RPdWdNMHV0cTZTWWd3NGVJUHVJTVNuaS9yREdHYkVkbS9CaFMvQm1DazVLR1JSbElnSXVXRDkraApvdFA2cTBvPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t';

describe('Check interop routes', () => {
  describe('POST /interop basic tests', () => {
    test(`should return ${httpStatus.BAD_REQUEST} without a body`, async () => {
      await request(app).post('/interop').send().expect(httpStatus.BAD_REQUEST);
    });
    test(`should return ${httpStatus.BAD_REQUEST} with an invalid action`, async () => {
      const body = {
        action: 'testme',
      };

      await request(app)
        .post('/interop')
        .send(body)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
  describe('POST /interop provision tests', () => {
    test(`should return ${httpStatus.BAD_REQUEST} with provision action with invalid cert`, async () => {
      const body = {
        action: 'provision',
        certs: ['acbdefghijklmnopqrstuvwxyz1234'],
      };

      await request(app)
        .post('/interop')
        .send(body)
        .expect(httpStatus.BAD_REQUEST);
    });
    test(`should return ${httpStatus.OK} with provision action`, async () => {
      const body = {
        action: 'provision',
        certs: [testCert],
      };

      await request(app).post('/interop').send(body).expect(httpStatus.OK);
    });
  });
});
