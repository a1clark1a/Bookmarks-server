process.env.TZ = "UTC"; //for macs
require("dotenv").config();
const { expect } = require("chai");
const supertest = require("supertest");

global.expect = expect;
global.supertest = supertest;
