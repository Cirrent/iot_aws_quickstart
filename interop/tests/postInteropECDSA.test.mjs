import httpStatus from "http-status";
import request from "supertest";
import { mockClient } from "aws-sdk-client-mock";
import {
  IoTClient,
  RegisterCertificateWithoutCACommand,
  CreateThingCommand,
  AttachThingPrincipalCommand,
  DescribeEndpointCommand,
  AttachPolicyCommand,
  GetPolicyCommand,
} from "@aws-sdk/client-iot";
import HttpRequestMock from "http-request-mock";
import fs from "fs";

import { app } from "../src/app.mjs";
import { genToken } from "./helpers/genToken.mjs";
import { getSerialNumber, getCertificate } from "../src/helpers/crypto.mjs";

import { publicKeyURL, thingNamePrefix } from "../src/vars.mjs";
const IoTClientMock = mockClient(IoTClient);

const mocker = HttpRequestMock.setup();

const testCert =
  "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUN4akNDQWt1Z0F3SUJBZ0lFRmZ5T29UQUtCZ2dxaGtqT1BRUURBekJ5TVFzd0NRWURWUVFHRXdKRVJURWgKTUI4R0ExVUVDZ3dZU1c1bWFXNWxiMjRnVkdWamFHNXZiRzluYVdWeklFRkhNUk13RVFZRFZRUUxEQXBQVUZSSgpSMEVvVkUwcE1Tc3dLUVlEVlFRRERDSkpibVpwYm1WdmJpQlBVRlJKUjBFb1ZFMHBJRlJ5ZFhOMElFMGdRMEVnCk16QTJNQjRYRFRJeU1EY3dOREV4TWpVME1Gb1hEVFF5TURjd05ERXhNalUwTUZvd0RURUxNQWtHQTFVRUF3d0MKSWlJd1dUQVRCZ2NxaGtqT1BRSUJCZ2dxaGtqT1BRTUJCd05DQUFRMGNKY2JrSXRrSHRMVGluNDRrWFFycENmKwpJSEhPdmtRUHVEMm41UjRmNTRqR1RmNXBiWlJLZWIzOENnYklxcktpTWdBYWcyNGhiOEsvVkF4elFtVXFvNElCCk1qQ0NBUzR3WUFZSUt3WUJCUVVIQVFFRVZEQlNNRkFHQ0NzR0FRVUZCekFDaGtSb2RIUndjem92TDNCcmFTNXAKYm1acGJtVnZiaTVqYjIwdlQzQjBhV2RoVkhKMWMzUkZZMk5EUVRNd05pOVBjSFJwWjJGVWNuVnpkRVZqWTBOQgpNekEyTG1OeWREQWRCZ05WSFE0RUZnUVVXYTl0bXhReDlsOGQrWFU2UHpqZmZ2OEVEUmN3RGdZRFZSMFBBUUgvCkJBUURBZ0NBTUF3R0ExVWRFd0VCL3dRQ01BQXdWUVlEVlIwZkJFNHdUREJLb0VpZ1JvWkVhSFIwY0hNNkx5OXcKYTJrdWFXNW1hVzVsYjI0dVkyOXRMMDl3ZEdsbllWUnlkWE4wUldOalEwRXpNRFl2VDNCMGFXZGhWSEoxYzNSRgpZMk5EUVRNd05pNWpjbXd3RlFZRFZSMGdCQTR3RERBS0JnZ3FnaFFBUkFFVUFUQWZCZ05WSFNNRUdEQVdnQlN6ClM2QUFmbDI5RFZKMGZsMXM0OXQ0UU1BRlpqQUtCZ2dxaGtqT1BRUURBd05wQURCbUFqRUErT1VVZDlBUzE3WVEKYVBKU2xseTRzMldmblBTQ2tVMk1ySWlhU0ovdHcySUp6a2d5VFp1cDhxT29LK1dzTWtrN0FqRUFnRTllNUMvNAoxalNEOWw1YkFlZ2d2bDZ1NWNnYXRWTzhIM08xaGl1ODRwVXc3T1lucUJUQjZ3SU42SENsbzQ0TgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==";

describe("Check interop ECDSA routes", () => {
  beforeEach(() => {
    IoTClientMock.reset();
    mocker.reset();
    mocker.mock({
      url: publicKeyURL,
      method: "GET",
      body: fs.readFileSync("./tests/cert/test-public.key"),
    });
  });
  describe("POST /interop basic tests", () => {
    test(`should return ${httpStatus.BAD_REQUEST} without a body`, async () => {
      const token = await genToken();
      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send();

      expect(res.statusCode).toEqual(httpStatus.BAD_REQUEST);
    });

    test(`should return ${httpStatus.BAD_REQUEST} with an invalid action`, async () => {
      const token = await genToken();
      const body = {
        action: "testme",
      };

      await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
  describe("POST /interop provision tests", () => {
    let thingName;

    beforeEach(async () => {
      let cert = await getCertificate(Buffer.from(testCert, "base64"));
      let testSerialNum = await getSerialNumber(cert);
      thingName = `${thingNamePrefix}${testSerialNum}`;
    });

    test(`should return ${httpStatus.BAD_REQUEST} with provision action with invalid (non-base64) cert`, async () => {
      const token = await genToken();
      const body = {
        action: "provision",
        certs: [
          {
            ref: "a",
            cert: "acbdefghijklmnopqrstuvwxyz1234",
          },
        ],
      };

      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.BAD_REQUEST);
    });

    test(`should return ${httpStatus.BAD_REQUEST} for input without reference`, async () => {
      const token = await genToken();
      const body = {
        action: "provision",
        certs: [
          {
            cert: testCert,
          },
        ],
      };

      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.BAD_REQUEST);
    });

    test(`should return ${httpStatus.OK} with provision action`, async () => {
      const certificateId = "1234";

      IoTClientMock.on(RegisterCertificateWithoutCACommand).resolves({
        certificateArn: "path::to::cert",
        certificateId,
      });
      IoTClientMock.on(CreateThingCommand).resolves({
        thingName,
      });
      IoTClientMock.on(AttachThingPrincipalCommand).resolves({});
      IoTClientMock.on(DescribeEndpointCommand).resolves({
        endpointAddress: "local-mocked",
      });
      IoTClientMock.on(AttachPolicyCommand).resolves({
        $metadata: "test",
      });
      IoTClientMock.on(GetPolicyCommand).resolves({
        policyArn: "testArn",
      });

      const token = await genToken();
      const body = {
        action: "provision",
        certs: [
          {
            ref: "a",
            cert: testCert,
          },
        ],
      };

      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body).toEqual([
        {
          ref: "a",
          status: "SUCCESS",
          endpoint: "local-mocked",
          topic: "iqs",
          policyApplied: true,
        },
      ]);

      const createThingCalls = IoTClientMock.commandCalls(CreateThingCommand);

      expect(createThingCalls).toHaveLength(1);
      expect(createThingCalls[0].args[0].input.thingName).toEqual(thingName);
    });

    test(`should return ${httpStatus.OK} with provision action with GetPolicyCommand error`, async () => {
      IoTClientMock.on(RegisterCertificateWithoutCACommand).resolves({
        certificateArn: "path::to::cert",
        certificateId: "1234",
      });
      IoTClientMock.on(CreateThingCommand).resolves({
        thingName,
      });
      IoTClientMock.on(AttachThingPrincipalCommand).resolves({});
      IoTClientMock.on(DescribeEndpointCommand).resolves({
        endpointAddress: "local-mocked",
      });
      IoTClientMock.on(AttachPolicyCommand).resolves({
        $metadata: "test",
      });
      IoTClientMock.on(GetPolicyCommand).rejects();

      const token = await genToken();
      const body = {
        action: "provision",
        certs: [
          {
            ref: "a",
            cert: testCert,
          },
        ],
      };

      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body).toEqual([
        {
          ref: "a",
          status: "SUCCESS",
          endpoint: "local-mocked",
          topic: "iqs",
          policyApplied: false,
        },
      ]);
    });

    test(`should return ${httpStatus.OK} with provision action with no policy`, async () => {
      IoTClientMock.on(RegisterCertificateWithoutCACommand).resolves({
        certificateArn: "path::to::cert",
        certificateId: "1234",
      });
      IoTClientMock.on(CreateThingCommand).resolves({
        thingName,
      });
      IoTClientMock.on(AttachThingPrincipalCommand).resolves({});
      IoTClientMock.on(DescribeEndpointCommand).resolves({
        endpointAddress: "local-mocked",
      });
      IoTClientMock.on(AttachPolicyCommand).resolves({
        $metadata: "test",
      });
      IoTClientMock.on(GetPolicyCommand).resolves({});

      const token = await genToken();
      const body = {
        action: "provision",
        certs: [
          {
            ref: "a",
            cert: testCert,
          },
        ],
      };

      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body).toEqual([
        {
          ref: "a",
          status: "SUCCESS",
          endpoint: "local-mocked",
          topic: "iqs",
          policyApplied: false,
        },
      ]);
    });

    test(`should return ${httpStatus.OK} with provision action with DescribeEndpointCommand error`, async () => {
      IoTClientMock.on(RegisterCertificateWithoutCACommand).resolves({
        certificateArn: "path::to::cert",
        certificateId: "1234",
      });
      IoTClientMock.on(CreateThingCommand).resolves({
        thingName,
      });
      IoTClientMock.on(AttachThingPrincipalCommand).resolves({});
      IoTClientMock.on(DescribeEndpointCommand).rejects();
      IoTClientMock.on(AttachPolicyCommand).resolves({
        $metadata: "test",
      });
      IoTClientMock.on(GetPolicyCommand).resolves({
        policyArn: "testArn",
      });

      const token = await genToken();
      const body = {
        action: "provision",
        certs: [
          {
            ref: "a",
            cert: testCert,
          },
        ],
      };

      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body).toEqual([
        {
          ref: "a",
          status: "SUCCESS",
          endpoint: null,
          topic: "iqs",
          policyApplied: true,
        },
      ]);
    });

    test(`should return ${httpStatus.OK} with provision action where certificate already exists`, async () => {
      IoTClientMock.on(RegisterCertificateWithoutCACommand).rejects({
        name: "ResourceAlreadyExistsException",
        certificateArn: "path::to::cert",
        certificateId: "1234",
      });
      IoTClientMock.on(CreateThingCommand).resolves({
        thingName,
      });
      IoTClientMock.on(AttachThingPrincipalCommand).resolves({});
      IoTClientMock.on(DescribeEndpointCommand).resolves({
        endpointAddress: "local-mocked",
      });
      IoTClientMock.on(AttachPolicyCommand).resolves({
        $metadata: "test",
      });
      IoTClientMock.on(GetPolicyCommand).resolves({
        policyArn: "testArn",
      });

      const token = await genToken();
      const body = {
        action: "provision",
        certs: [
          {
            ref: "a",
            cert: testCert,
          },
        ],
      };

      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body).toEqual([
        {
          ref: "a",
          status: "SUCCESS",
          endpoint: "local-mocked",
          topic: "iqs",
          policyApplied: true,
        },
      ]);
    });

    test(`should return ${httpStatus.OK} with provision action with RegisterCertificateWithoutCACommand error`, async () => {
      IoTClientMock.on(RegisterCertificateWithoutCACommand).rejects();
      IoTClientMock.on(CreateThingCommand).resolves({
        thingName,
      });
      IoTClientMock.on(AttachThingPrincipalCommand).resolves({});
      IoTClientMock.on(DescribeEndpointCommand).resolves({
        endpointAddress: "local-mocked",
      });
      IoTClientMock.on(AttachPolicyCommand).resolves({
        $metadata: "test",
      });
      IoTClientMock.on(GetPolicyCommand).resolves({
        policyArn: "testArn",
      });

      const token = await genToken();
      const body = {
        action: "provision",
        certs: [
          {
            ref: "a",
            cert: testCert,
          },
        ],
      };

      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body).toEqual([
        {
          ref: "a",
          status: "ERROR",
          message: "Failed creating and registering thing",
        },
      ]);
    });

    test(`should return ${httpStatus.OK} test 2 certs, one good and one bad`, async () => {
      IoTClientMock.on(RegisterCertificateWithoutCACommand).resolves({
        certificateArn: "path::to::cert",
        certificateId: "1234",
      });
      IoTClientMock.on(CreateThingCommand).resolves({
        thingName,
      });
      IoTClientMock.on(AttachThingPrincipalCommand).resolves({});
      IoTClientMock.on(DescribeEndpointCommand).resolves({
        endpointAddress: "local-mocked",
      });
      IoTClientMock.on(AttachPolicyCommand).resolves({
        $metadata: "test",
      });
      IoTClientMock.on(GetPolicyCommand).resolves({
        policyArn: "testArn",
      });

      const token = await genToken();
      const body = {
        action: "provision",
        certs: [
          {
            ref: "a",
            cert: testCert,
          },
          {
            ref: "b",
            cert: "dGVzdGluZw==",
          },
        ],
      };

      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body).toEqual([
        {
          ref: "a",
          status: "SUCCESS",
          endpoint: "local-mocked",
          topic: "iqs",
          policyApplied: true,
        },
        {
          ref: "b",
          status: "ERROR",
          message: "Cannot decode certitifcate",
        },
      ]);
    });

    test(`should return ${httpStatus.OK} with status action`, async () => {
      const token = await genToken();
      const body = {
        action: "status",
      };

      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        message: "Not yet implemented.",
        action: "status",
      });
    });

    test(`should return ${httpStatus.OK} with message action`, async () => {
      const token = await genToken();
      const body = {
        action: "message",
      };

      const res = await request(app)
        .post("/interop")
        .set("Authorization", token)
        .send(body);

      expect(res.statusCode).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        message: "Not yet implemented.",
        action: "message",
      });
    });
  });
});
