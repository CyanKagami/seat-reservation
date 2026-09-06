import { encode } from "@msgpack/msgpack";
import { writeFile } from "fs";

let  file = {
  "version": "1.0",
  "timestamp": "2026-09-06T11:18:06.743Z",
  "canvas": {
    "gridWidth": 111,
    "gridHeight": 60
  },
  "objects": [
    {
      "id": "seat_1",
      "type": "seat",
      "x": 56,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_2",
      "type": "seat",
      "x": 86,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_3",
      "type": "seat",
      "x": 116,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_4",
      "type": "seat",
      "x": 146,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_5",
      "type": "seat",
      "x": 176,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_6",
      "type": "seat",
      "x": 206,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_7",
      "type": "seat",
      "x": 236,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_8",
      "type": "seat",
      "x": 266,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_9",
      "type": "seat",
      "x": 296,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_10",
      "type": "seat",
      "x": 326,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_11",
      "type": "seat",
      "x": 356,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_12",
      "type": "seat",
      "x": 386,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_13",
      "type": "seat",
      "x": 416,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_14",
      "type": "seat",
      "x": 446,
      "y": 57.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_15",
      "type": "seat",
      "x": 56,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_16",
      "type": "seat",
      "x": 86,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_17",
      "type": "seat",
      "x": 116,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_18",
      "type": "seat",
      "x": 146,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_19",
      "type": "seat",
      "x": 176,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_20",
      "type": "seat",
      "x": 206,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_21",
      "type": "seat",
      "x": 236,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_22",
      "type": "seat",
      "x": 266,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_23",
      "type": "seat",
      "x": 296,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_24",
      "type": "seat",
      "x": 326,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_25",
      "type": "seat",
      "x": 356,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_26",
      "type": "seat",
      "x": 386,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_27",
      "type": "seat",
      "x": 416,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_28",
      "type": "seat",
      "x": 446,
      "y": 87.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_29",
      "type": "seat",
      "x": 56,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_30",
      "type": "seat",
      "x": 86,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_31",
      "type": "seat",
      "x": 116,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_32",
      "type": "seat",
      "x": 146,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_33",
      "type": "seat",
      "x": 176,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_34",
      "type": "seat",
      "x": 206,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_35",
      "type": "seat",
      "x": 236,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_36",
      "type": "seat",
      "x": 266,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_37",
      "type": "seat",
      "x": 296,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_38",
      "type": "seat",
      "x": 326,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_39",
      "type": "seat",
      "x": 356,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_40",
      "type": "seat",
      "x": 386,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_41",
      "type": "seat",
      "x": 416,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_42",
      "type": "seat",
      "x": 446,
      "y": 117.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_43",
      "type": "seat",
      "x": 56,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_44",
      "type": "seat",
      "x": 86,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_45",
      "type": "seat",
      "x": 116,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_46",
      "type": "seat",
      "x": 146,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_47",
      "type": "seat",
      "x": 176,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_48",
      "type": "seat",
      "x": 206,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_49",
      "type": "seat",
      "x": 236,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_50",
      "type": "seat",
      "x": 266,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_51",
      "type": "seat",
      "x": 296,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_52",
      "type": "seat",
      "x": 326,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_53",
      "type": "seat",
      "x": 356,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_54",
      "type": "seat",
      "x": 386,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_55",
      "type": "seat",
      "x": 416,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_56",
      "type": "seat",
      "x": 446,
      "y": 147.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_57",
      "type": "seat",
      "x": 56,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_58",
      "type": "seat",
      "x": 86,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_59",
      "type": "seat",
      "x": 116,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_60",
      "type": "seat",
      "x": 146,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_61",
      "type": "seat",
      "x": 176,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_62",
      "type": "seat",
      "x": 206,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_63",
      "type": "seat",
      "x": 236,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_64",
      "type": "seat",
      "x": 266,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_65",
      "type": "seat",
      "x": 296,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_66",
      "type": "seat",
      "x": 326,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_67",
      "type": "seat",
      "x": 356,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_68",
      "type": "seat",
      "x": 386,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_69",
      "type": "seat",
      "x": 416,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_70",
      "type": "seat",
      "x": 446,
      "y": 177.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_71",
      "type": "seat",
      "x": 56,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_72",
      "type": "seat",
      "x": 86,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_73",
      "type": "seat",
      "x": 116,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_74",
      "type": "seat",
      "x": 146,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_75",
      "type": "seat",
      "x": 176,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_76",
      "type": "seat",
      "x": 206,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_77",
      "type": "seat",
      "x": 236,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_78",
      "type": "seat",
      "x": 266,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_79",
      "type": "seat",
      "x": 296,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_80",
      "type": "seat",
      "x": 326,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_81",
      "type": "seat",
      "x": 356,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_82",
      "type": "seat",
      "x": 386,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_83",
      "type": "seat",
      "x": 416,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_84",
      "type": "seat",
      "x": 446,
      "y": 207.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_85",
      "type": "seat",
      "x": 56,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_86",
      "type": "seat",
      "x": 86,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_87",
      "type": "seat",
      "x": 116,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_88",
      "type": "seat",
      "x": 146,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_89",
      "type": "seat",
      "x": 176,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_90",
      "type": "seat",
      "x": 206,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_91",
      "type": "seat",
      "x": 236,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_92",
      "type": "seat",
      "x": 266,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_93",
      "type": "seat",
      "x": 296,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_94",
      "type": "seat",
      "x": 326,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_95",
      "type": "seat",
      "x": 356,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_96",
      "type": "seat",
      "x": 386,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_97",
      "type": "seat",
      "x": 416,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_98",
      "type": "seat",
      "x": 446,
      "y": 237.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_99",
      "type": "seat",
      "x": 56,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_100",
      "type": "seat",
      "x": 86,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_101",
      "type": "seat",
      "x": 116,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_102",
      "type": "seat",
      "x": 146,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_103",
      "type": "seat",
      "x": 176,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_104",
      "type": "seat",
      "x": 206,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_105",
      "type": "seat",
      "x": 236,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_106",
      "type": "seat",
      "x": 266,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_107",
      "type": "seat",
      "x": 296,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_108",
      "type": "seat",
      "x": 326,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_109",
      "type": "seat",
      "x": 356,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_110",
      "type": "seat",
      "x": 386,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_111",
      "type": "seat",
      "x": 416,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_112",
      "type": "seat",
      "x": 446,
      "y": 267.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_113",
      "type": "seat",
      "x": 56,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_114",
      "type": "seat",
      "x": 86,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_115",
      "type": "seat",
      "x": 116,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_116",
      "type": "seat",
      "x": 146,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_117",
      "type": "seat",
      "x": 176,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_118",
      "type": "seat",
      "x": 206,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_119",
      "type": "seat",
      "x": 236,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_120",
      "type": "seat",
      "x": 266,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_121",
      "type": "seat",
      "x": 296,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_122",
      "type": "seat",
      "x": 326,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_123",
      "type": "seat",
      "x": 356,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_124",
      "type": "seat",
      "x": 386,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_125",
      "type": "seat",
      "x": 416,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_126",
      "type": "seat",
      "x": 446,
      "y": 297.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_127",
      "type": "seat",
      "x": 56,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_128",
      "type": "seat",
      "x": 86,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_129",
      "type": "seat",
      "x": 116,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_130",
      "type": "seat",
      "x": 146,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_131",
      "type": "seat",
      "x": 176,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_132",
      "type": "seat",
      "x": 206,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_133",
      "type": "seat",
      "x": 236,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_134",
      "type": "seat",
      "x": 266,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_135",
      "type": "seat",
      "x": 296,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_136",
      "type": "seat",
      "x": 326,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_137",
      "type": "seat",
      "x": 356,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_138",
      "type": "seat",
      "x": 386,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_139",
      "type": "seat",
      "x": 416,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_140",
      "type": "seat",
      "x": 446,
      "y": 327.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_141",
      "type": "seat",
      "x": 56,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_142",
      "type": "seat",
      "x": 86,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_143",
      "type": "seat",
      "x": 116,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_144",
      "type": "seat",
      "x": 146,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_145",
      "type": "seat",
      "x": 176,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_146",
      "type": "seat",
      "x": 206,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_147",
      "type": "seat",
      "x": 236,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_148",
      "type": "seat",
      "x": 266,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_149",
      "type": "seat",
      "x": 296,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_150",
      "type": "seat",
      "x": 326,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_151",
      "type": "seat",
      "x": 356,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_152",
      "type": "seat",
      "x": 386,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_153",
      "type": "seat",
      "x": 416,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_154",
      "type": "seat",
      "x": 446,
      "y": 357.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_155",
      "type": "seat",
      "x": 56,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_156",
      "type": "seat",
      "x": 86,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_157",
      "type": "seat",
      "x": 116,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_158",
      "type": "seat",
      "x": 146,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_159",
      "type": "seat",
      "x": 176,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_160",
      "type": "seat",
      "x": 206,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_161",
      "type": "seat",
      "x": 236,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_162",
      "type": "seat",
      "x": 266,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_163",
      "type": "seat",
      "x": 296,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_164",
      "type": "seat",
      "x": 326,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_165",
      "type": "seat",
      "x": 356,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_166",
      "type": "seat",
      "x": 386,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_167",
      "type": "seat",
      "x": 416,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_168",
      "type": "seat",
      "x": 446,
      "y": 387.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_169",
      "type": "seat",
      "x": 56,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_170",
      "type": "seat",
      "x": 86,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_171",
      "type": "seat",
      "x": 116,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_172",
      "type": "seat",
      "x": 146,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_173",
      "type": "seat",
      "x": 176,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_174",
      "type": "seat",
      "x": 206,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_175",
      "type": "seat",
      "x": 236,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_176",
      "type": "seat",
      "x": 266,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_177",
      "type": "seat",
      "x": 296,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_178",
      "type": "seat",
      "x": 326,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_179",
      "type": "seat",
      "x": 356,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_180",
      "type": "seat",
      "x": 386,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_181",
      "type": "seat",
      "x": 416,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_182",
      "type": "seat",
      "x": 446,
      "y": 417.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_183",
      "type": "seat",
      "x": 56,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_184",
      "type": "seat",
      "x": 86,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_185",
      "type": "seat",
      "x": 116,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_186",
      "type": "seat",
      "x": 146,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_187",
      "type": "seat",
      "x": 176,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_188",
      "type": "seat",
      "x": 206,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_189",
      "type": "seat",
      "x": 236,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_190",
      "type": "seat",
      "x": 266,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_191",
      "type": "seat",
      "x": 296,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_192",
      "type": "seat",
      "x": 326,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_193",
      "type": "seat",
      "x": 356,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_194",
      "type": "seat",
      "x": 386,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_195",
      "type": "seat",
      "x": 416,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_196",
      "type": "seat",
      "x": 446,
      "y": 447.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_197",
      "type": "seat",
      "x": 56,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_198",
      "type": "seat",
      "x": 86,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_199",
      "type": "seat",
      "x": 116,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_200",
      "type": "seat",
      "x": 146,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_201",
      "type": "seat",
      "x": 176,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_202",
      "type": "seat",
      "x": 206,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_203",
      "type": "seat",
      "x": 236,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_204",
      "type": "seat",
      "x": 266,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_205",
      "type": "seat",
      "x": 296,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_206",
      "type": "seat",
      "x": 326,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_207",
      "type": "seat",
      "x": 356,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_208",
      "type": "seat",
      "x": 386,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_209",
      "type": "seat",
      "x": 416,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_210",
      "type": "seat",
      "x": 446,
      "y": 477.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_211",
      "type": "seat",
      "x": 56,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_212",
      "type": "seat",
      "x": 86,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_213",
      "type": "seat",
      "x": 116,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_214",
      "type": "seat",
      "x": 146,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_215",
      "type": "seat",
      "x": 176,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_216",
      "type": "seat",
      "x": 206,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_217",
      "type": "seat",
      "x": 236,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_218",
      "type": "seat",
      "x": 266,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_219",
      "type": "seat",
      "x": 296,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_220",
      "type": "seat",
      "x": 326,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_221",
      "type": "seat",
      "x": 356,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_222",
      "type": "seat",
      "x": 386,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_223",
      "type": "seat",
      "x": 416,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "seat_224",
      "type": "seat",
      "x": 446,
      "y": 507.5,
      "width": 20,
      "height": 20
    },
    {
      "id": "icon_poly_1788693383061",
      "type": "env-icon-polygon",
      "iconType": "stage",
      "label": "เวที",
      "x": 572,
      "y": 56.5,
      "width": 120,
      "height": 80,
      "points": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 120,
          "y": 0
        },
        {
          "x": 117,
          "y": 474
        },
        {
          "x": -1,
          "y": 473
        }
      ],
      "rotation": 0
    },
    {
      "id": "icon_poly_1788693393498",
      "type": "env-icon-polygon",
      "iconType": "entrance",
      "label": "ประตู",
      "x": 127,
      "y": 515.5,
      "width": 120,
      "height": 80,
      "points": [
        {
          "x": 0,
          "y": 39
        },
        {
          "x": 120,
          "y": 39
        },
        {
          "x": 120,
          "y": 80
        },
        {
          "x": 0,
          "y": 80
        }
      ],
      "rotation": 0
    },
    {
      "id": "icon_poly_1788693416110",
      "type": "env-icon-polygon",
      "iconType": "toilet",
      "label": "ห้องน้ำ",
      "x": 272,
      "y": 520,
      "width": 120,
      "height": 80,
      "points": [
        {
          "x": 0,
          "y": 37.5
        },
        {
          "x": 122,
          "y": 37.5
        },
        {
          "x": 120,
          "y": 80
        },
        {
          "x": 0,
          "y": 80
        }
      ],
      "rotation": 0
    },
    {
      "id": "seat_228",
      "type": "seat",
      "x": 746,
      "y": 58.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_229",
      "type": "seat",
      "x": 776,
      "y": 58.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_230",
      "type": "seat",
      "x": 806,
      "y": 58.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_231",
      "type": "seat",
      "x": 836,
      "y": 58.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_232",
      "type": "seat",
      "x": 866,
      "y": 58.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_233",
      "type": "seat",
      "x": 896,
      "y": 58.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_234",
      "type": "seat",
      "x": 926,
      "y": 58.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_235",
      "type": "seat",
      "x": 956,
      "y": 58.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_236",
      "type": "seat",
      "x": 986,
      "y": 58.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_237",
      "type": "seat",
      "x": 1016,
      "y": 58.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_238",
      "type": "seat",
      "x": 1046,
      "y": 58.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_239",
      "type": "seat",
      "x": 746,
      "y": 88.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_240",
      "type": "seat",
      "x": 776,
      "y": 88.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_241",
      "type": "seat",
      "x": 806,
      "y": 88.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_242",
      "type": "seat",
      "x": 836,
      "y": 88.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_243",
      "type": "seat",
      "x": 866,
      "y": 88.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_244",
      "type": "seat",
      "x": 896,
      "y": 88.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_245",
      "type": "seat",
      "x": 926,
      "y": 88.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_246",
      "type": "seat",
      "x": 956,
      "y": 88.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_247",
      "type": "seat",
      "x": 986,
      "y": 88.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_248",
      "type": "seat",
      "x": 1016,
      "y": 88.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_249",
      "type": "seat",
      "x": 1046,
      "y": 88.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_250",
      "type": "seat",
      "x": 746,
      "y": 118.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_251",
      "type": "seat",
      "x": 776,
      "y": 118.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_252",
      "type": "seat",
      "x": 806,
      "y": 118.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_253",
      "type": "seat",
      "x": 836,
      "y": 118.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_254",
      "type": "seat",
      "x": 866,
      "y": 118.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_255",
      "type": "seat",
      "x": 896,
      "y": 118.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_256",
      "type": "seat",
      "x": 926,
      "y": 118.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_257",
      "type": "seat",
      "x": 956,
      "y": 118.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_258",
      "type": "seat",
      "x": 986,
      "y": 118.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_259",
      "type": "seat",
      "x": 1016,
      "y": 118.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_260",
      "type": "seat",
      "x": 1046,
      "y": 118.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_261",
      "type": "seat",
      "x": 746,
      "y": 148.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_262",
      "type": "seat",
      "x": 776,
      "y": 148.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_263",
      "type": "seat",
      "x": 806,
      "y": 148.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_264",
      "type": "seat",
      "x": 836,
      "y": 148.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_265",
      "type": "seat",
      "x": 866,
      "y": 148.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_266",
      "type": "seat",
      "x": 896,
      "y": 148.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_267",
      "type": "seat",
      "x": 926,
      "y": 148.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_268",
      "type": "seat",
      "x": 956,
      "y": 148.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_269",
      "type": "seat",
      "x": 986,
      "y": 148.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_270",
      "type": "seat",
      "x": 1016,
      "y": 148.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_271",
      "type": "seat",
      "x": 1046,
      "y": 148.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_272",
      "type": "seat",
      "x": 746,
      "y": 178.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_273",
      "type": "seat",
      "x": 776,
      "y": 178.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_274",
      "type": "seat",
      "x": 806,
      "y": 178.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_275",
      "type": "seat",
      "x": 836,
      "y": 178.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_276",
      "type": "seat",
      "x": 866,
      "y": 178.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_277",
      "type": "seat",
      "x": 896,
      "y": 178.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_278",
      "type": "seat",
      "x": 926,
      "y": 178.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_279",
      "type": "seat",
      "x": 956,
      "y": 178.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_280",
      "type": "seat",
      "x": 986,
      "y": 178.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_281",
      "type": "seat",
      "x": 1016,
      "y": 178.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_282",
      "type": "seat",
      "x": 1046,
      "y": 178.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_283",
      "type": "seat",
      "x": 746,
      "y": 208.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_284",
      "type": "seat",
      "x": 776,
      "y": 208.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_285",
      "type": "seat",
      "x": 806,
      "y": 208.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_286",
      "type": "seat",
      "x": 836,
      "y": 208.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_287",
      "type": "seat",
      "x": 866,
      "y": 208.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_288",
      "type": "seat",
      "x": 896,
      "y": 208.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_289",
      "type": "seat",
      "x": 926,
      "y": 208.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_290",
      "type": "seat",
      "x": 956,
      "y": 208.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_291",
      "type": "seat",
      "x": 986,
      "y": 208.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_292",
      "type": "seat",
      "x": 1016,
      "y": 208.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_293",
      "type": "seat",
      "x": 1046,
      "y": 208.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_294",
      "type": "seat",
      "x": 746,
      "y": 238.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_295",
      "type": "seat",
      "x": 776,
      "y": 238.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_296",
      "type": "seat",
      "x": 806,
      "y": 238.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_297",
      "type": "seat",
      "x": 836,
      "y": 238.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_298",
      "type": "seat",
      "x": 866,
      "y": 238.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_299",
      "type": "seat",
      "x": 896,
      "y": 238.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_300",
      "type": "seat",
      "x": 926,
      "y": 238.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_301",
      "type": "seat",
      "x": 956,
      "y": 238.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_302",
      "type": "seat",
      "x": 986,
      "y": 238.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_303",
      "type": "seat",
      "x": 1016,
      "y": 238.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_304",
      "type": "seat",
      "x": 1046,
      "y": 238.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_305",
      "type": "seat",
      "x": 746,
      "y": 268.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_306",
      "type": "seat",
      "x": 776,
      "y": 268.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_307",
      "type": "seat",
      "x": 806,
      "y": 268.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_308",
      "type": "seat",
      "x": 836,
      "y": 268.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_309",
      "type": "seat",
      "x": 866,
      "y": 268.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_310",
      "type": "seat",
      "x": 896,
      "y": 268.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_311",
      "type": "seat",
      "x": 926,
      "y": 268.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_312",
      "type": "seat",
      "x": 956,
      "y": 268.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_313",
      "type": "seat",
      "x": 986,
      "y": 268.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_314",
      "type": "seat",
      "x": 1016,
      "y": 268.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_315",
      "type": "seat",
      "x": 1046,
      "y": 268.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_316",
      "type": "seat",
      "x": 746,
      "y": 298.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_317",
      "type": "seat",
      "x": 776,
      "y": 298.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_318",
      "type": "seat",
      "x": 806,
      "y": 298.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_319",
      "type": "seat",
      "x": 836,
      "y": 298.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_320",
      "type": "seat",
      "x": 866,
      "y": 298.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_321",
      "type": "seat",
      "x": 896,
      "y": 298.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_322",
      "type": "seat",
      "x": 926,
      "y": 298.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_323",
      "type": "seat",
      "x": 956,
      "y": 298.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_324",
      "type": "seat",
      "x": 986,
      "y": 298.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_325",
      "type": "seat",
      "x": 1016,
      "y": 298.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_326",
      "type": "seat",
      "x": 1046,
      "y": 298.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_327",
      "type": "seat",
      "x": 746,
      "y": 328.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_328",
      "type": "seat",
      "x": 776,
      "y": 328.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_329",
      "type": "seat",
      "x": 806,
      "y": 328.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_330",
      "type": "seat",
      "x": 836,
      "y": 328.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_331",
      "type": "seat",
      "x": 866,
      "y": 328.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_332",
      "type": "seat",
      "x": 896,
      "y": 328.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_333",
      "type": "seat",
      "x": 926,
      "y": 328.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_334",
      "type": "seat",
      "x": 956,
      "y": 328.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_335",
      "type": "seat",
      "x": 986,
      "y": 328.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_336",
      "type": "seat",
      "x": 1016,
      "y": 328.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_337",
      "type": "seat",
      "x": 1046,
      "y": 328.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_338",
      "type": "seat",
      "x": 746,
      "y": 358.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_339",
      "type": "seat",
      "x": 776,
      "y": 358.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_340",
      "type": "seat",
      "x": 806,
      "y": 358.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_341",
      "type": "seat",
      "x": 836,
      "y": 358.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_342",
      "type": "seat",
      "x": 866,
      "y": 358.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_343",
      "type": "seat",
      "x": 896,
      "y": 358.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_344",
      "type": "seat",
      "x": 926,
      "y": 358.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_345",
      "type": "seat",
      "x": 956,
      "y": 358.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_346",
      "type": "seat",
      "x": 986,
      "y": 358.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_347",
      "type": "seat",
      "x": 1016,
      "y": 358.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_348",
      "type": "seat",
      "x": 1046,
      "y": 358.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_349",
      "type": "seat",
      "x": 746,
      "y": 388.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_350",
      "type": "seat",
      "x": 776,
      "y": 388.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_351",
      "type": "seat",
      "x": 806,
      "y": 388.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_352",
      "type": "seat",
      "x": 836,
      "y": 388.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_353",
      "type": "seat",
      "x": 866,
      "y": 388.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_354",
      "type": "seat",
      "x": 896,
      "y": 388.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_355",
      "type": "seat",
      "x": 926,
      "y": 388.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_356",
      "type": "seat",
      "x": 956,
      "y": 388.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_357",
      "type": "seat",
      "x": 986,
      "y": 388.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_358",
      "type": "seat",
      "x": 1016,
      "y": 388.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_359",
      "type": "seat",
      "x": 1046,
      "y": 388.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_360",
      "type": "seat",
      "x": 746,
      "y": 418.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_361",
      "type": "seat",
      "x": 776,
      "y": 418.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_362",
      "type": "seat",
      "x": 806,
      "y": 418.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_363",
      "type": "seat",
      "x": 836,
      "y": 418.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_364",
      "type": "seat",
      "x": 866,
      "y": 418.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_365",
      "type": "seat",
      "x": 896,
      "y": 418.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_366",
      "type": "seat",
      "x": 926,
      "y": 418.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_367",
      "type": "seat",
      "x": 956,
      "y": 418.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_368",
      "type": "seat",
      "x": 986,
      "y": 418.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_369",
      "type": "seat",
      "x": 1016,
      "y": 418.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_370",
      "type": "seat",
      "x": 1046,
      "y": 418.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_371",
      "type": "seat",
      "x": 746,
      "y": 448.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_372",
      "type": "seat",
      "x": 776,
      "y": 448.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_373",
      "type": "seat",
      "x": 806,
      "y": 448.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_374",
      "type": "seat",
      "x": 836,
      "y": 448.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_375",
      "type": "seat",
      "x": 866,
      "y": 448.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_376",
      "type": "seat",
      "x": 896,
      "y": 448.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_377",
      "type": "seat",
      "x": 926,
      "y": 448.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_378",
      "type": "seat",
      "x": 956,
      "y": 448.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_379",
      "type": "seat",
      "x": 986,
      "y": 448.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_380",
      "type": "seat",
      "x": 1016,
      "y": 448.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_381",
      "type": "seat",
      "x": 1046,
      "y": 448.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_382",
      "type": "seat",
      "x": 746,
      "y": 478.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_383",
      "type": "seat",
      "x": 776,
      "y": 478.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_384",
      "type": "seat",
      "x": 806,
      "y": 478.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_385",
      "type": "seat",
      "x": 836,
      "y": 478.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_386",
      "type": "seat",
      "x": 866,
      "y": 478.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_387",
      "type": "seat",
      "x": 896,
      "y": 478.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_388",
      "type": "seat",
      "x": 926,
      "y": 478.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_389",
      "type": "seat",
      "x": 956,
      "y": 478.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_390",
      "type": "seat",
      "x": 986,
      "y": 478.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_391",
      "type": "seat",
      "x": 1016,
      "y": 478.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_392",
      "type": "seat",
      "x": 1046,
      "y": 478.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_393",
      "type": "seat",
      "x": 746,
      "y": 508.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_394",
      "type": "seat",
      "x": 776,
      "y": 508.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_395",
      "type": "seat",
      "x": 806,
      "y": 508.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_396",
      "type": "seat",
      "x": 836,
      "y": 508.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_397",
      "type": "seat",
      "x": 866,
      "y": 508.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_398",
      "type": "seat",
      "x": 896,
      "y": 508.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_399",
      "type": "seat",
      "x": 926,
      "y": 508.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_400",
      "type": "seat",
      "x": 956,
      "y": 508.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_401",
      "type": "seat",
      "x": 986,
      "y": 508.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_402",
      "type": "seat",
      "x": 1016,
      "y": 508.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    },
    {
      "id": "seat_403",
      "type": "seat",
      "x": 1046,
      "y": 508.5,
      "width": 20,
      "height": 20,
      "metadata": {
        "characteristic": "vip"
      }
    }
  ]
}

const binaryData = encode(file)
const blob = new Blob([binaryData], { type: 'application/msgpack' });
const newFile = new File([blob], `1.msgpack`, {
	type: blob.type,
	lastModified: Date.now()
});
writeFile('1.msgpack', binaryData,()=>{});