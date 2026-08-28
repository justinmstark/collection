--
-- PostgreSQL database dump
--

\restrict XTJyMB8Hl3LCDhlg4XxAHOxpmo959GmjjU4pC9aZAQsr3OvkywbbRexulD6hO64

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: CollectionItem; Type: TABLE; Schema: public; Owner: collection
--

CREATE TABLE public."CollectionItem" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text,
    "customName" text,
    quantity integer DEFAULT 1 NOT NULL,
    "purchasePrice" double precision,
    "purchaseDate" timestamp(3) without time zone,
    "openedDate" timestamp(3) without time zone,
    status text DEFAULT 'sealed'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CollectionItem" OWNER TO collection;

--
-- Name: ItemImage; Type: TABLE; Schema: public; Owner: collection
--

CREATE TABLE public."ItemImage" (
    id text NOT NULL,
    "collectionItemId" text NOT NULL,
    "storageKey" text NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ItemImage" OWNER TO collection;

--
-- Name: Producer; Type: TABLE; Schema: public; Owner: collection
--

CREATE TABLE public."Producer" (
    id text NOT NULL,
    name text NOT NULL,
    "regionId" text
);


ALTER TABLE public."Producer" OWNER TO collection;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: collection
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    "producerId" text,
    category text NOT NULL,
    subcategory text,
    age integer,
    abv double precision,
    "caskType" text,
    description text,
    "imageUrl" text,
    barcode text,
    "smwsCode" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Product" OWNER TO collection;

--
-- Name: Region; Type: TABLE; Schema: public; Owner: collection
--

CREATE TABLE public."Region" (
    id text NOT NULL,
    name text NOT NULL,
    country text NOT NULL
);


ALTER TABLE public."Region" OWNER TO collection;

--
-- Name: User; Type: TABLE; Schema: public; Owner: collection
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    "hashedPassword" text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO collection;

--
-- Name: Valuation; Type: TABLE; Schema: public; Owner: collection
--

CREATE TABLE public."Valuation" (
    id text NOT NULL,
    "collectionItemId" text NOT NULL,
    value double precision NOT NULL,
    "valuedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    source text
);


ALTER TABLE public."Valuation" OWNER TO collection;

--
-- Data for Name: CollectionItem; Type: TABLE DATA; Schema: public; Owner: collection
--

COPY public."CollectionItem" (id, "userId", "productId", "customName", quantity, "purchasePrice", "purchaseDate", "openedDate", status, notes, "createdAt") FROM stdin;
cmtau4k6b0003149mv3l9hrcf	cmtau2m370000i6b8uhyf0c4l	cmtau4k6a0001149mbcyfaexk	\N	1	59	\N	\N	sealed	\N	2026-08-27 01:19:20.868
cmtau4k6q000c149ms098n0hm	cmtau2m370000i6b8uhyf0c4l	cmtau4k6p000a149mmvssmqgq	\N	1	199	\N	\N	sealed	\N	2026-08-27 01:19:20.883
cmtau4k6x000l149m0wfa401i	cmtau2m370000i6b8uhyf0c4l	cmtau4k6v000j149mw409i776	\N	1	399	\N	\N	sealed	\N	2026-08-27 01:19:20.889
cmtau4k70000u149ml1fi5lhj	cmtau2m370000i6b8uhyf0c4l	cmtau4k70000s149mcyedi9oo	\N	1	95	\N	\N	sealed	\N	2026-08-27 01:19:20.893
cmtau4k740013149mspdkkxgt	cmtau2m370000i6b8uhyf0c4l	cmtau4k730011149mfwst1dh7	\N	1	280	\N	\N	sealed	\N	2026-08-27 01:19:20.896
cmtau4k77001c149mz75cf6pd	cmtau2m370000i6b8uhyf0c4l	cmtau4k76001a149mbllpwwsq	\N	1	125	\N	\N	sealed	\N	2026-08-27 01:19:20.899
cmtau4k7a001k149mdtaz04h2	cmtau2m370000i6b8uhyf0c4l	cmtau4k79001i149mhwv0szrk	\N	1	115	\N	\N	sealed	\N	2026-08-27 01:19:20.902
cmtau4k7d001s149mhpp4wbvg	cmtau2m370000i6b8uhyf0c4l	cmtau4k7c001q149mdha4ys67	\N	1	120	\N	\N	sealed	\N	2026-08-27 01:19:20.905
cmtau4k7g0021149mrypia701	cmtau2m370000i6b8uhyf0c4l	cmtau4k7f001z149m61tfm65y	\N	1	135	\N	\N	sealed	\N	2026-08-27 01:19:20.908
cmtau4k7j0029149mqyf08cy0	cmtau2m370000i6b8uhyf0c4l	cmtau4k7i0027149ms84jgrhi	\N	1	175	\N	\N	sealed	\N	2026-08-27 01:19:20.911
cmtaygsal0003brt6qah7pblh	cmtau2m370000i6b8uhyf0c4l	cmtaygsaj0001brt656t3t4jn	\N	1	135	\N	\N	sealed	Pedro Ximénez Edition, Iberian Series. Triple distilled, matured in bourbon and oloroso sherry casks, re-casked in PX hogsheads.	2026-08-27 03:20:49.726
cmtaygsap000abrt6th9sr7p0	cmtau2m370000i6b8uhyf0c4l	cmtaygsap0008brt6tzjkj0n4	\N	1	65	\N	\N	sealed	Blended Scotch Whisky aged 12 years.	2026-08-27 03:20:49.73
cmtayqzuj00053hc1gxcg96xy	cmtau2m370000i6b8uhyf0c4l	cmtayqzui00033hc1xpvzisbg	\N	1	295	\N	\N	sealed	Single Cask, White Oak, Cask No. 910. Tasting notes: leather, wood polish, glazed cherries. Truly limited release.	2026-08-27 03:28:46.076
cmtayqzuo000c3hc1x37nlm12	cmtau2m370000i6b8uhyf0c4l	cmtayqzun000a3hc1pkn1d20z	\N	1	110	\N	\N	sealed	Single Malt Irish Whiskey, Cigar Malt expression, 46.1% ABV, 700ml.	2026-08-27 03:28:46.08
cmtayqzuq000i3hc1r6etlih2	cmtau2m370000i6b8uhyf0c4l	cmtayqzup000g3hc1o4ymke58	\N	1	99	\N	\N	sealed	Highland Single Malt Scotch Whisky. Caribbean Rum Cask matured. Non-chill filtered, natural colour. Whisky Club exclusive.	2026-08-27 03:28:46.082
cmtayt9140003q2rgd5s1i94t	cmtau2m370000i6b8uhyf0c4l	cmtayt9120001q2rgv9sz1bvv	\N	1	280	\N	\N	sealed	Tasmanian Single Malt Whisky. Rare Seppeltsfield expression, Tawny Cask Matured. Whisky Club exclusive.	2026-08-27 03:30:31.288
cmtayt9170007q2rg7vg0e0fq	cmtau2m370000i6b8uhyf0c4l	cmtayt9170005q2rgu2zmjpgu	\N	1	145	\N	\N	sealed	Single Malt Scotch Whisky. Speyside. Created exclusively for The Whisky Club.	2026-08-27 03:30:31.292
cmtayt91a000bq2rgvru0569e	cmtau2m370000i6b8uhyf0c4l	cmtayt9190009q2rg0nmfjvq6	\N	1	145	\N	\N	sealed	Single Malt Scotch Whisky. Speyside. EST 1898. Created exclusively for The Whisky Club.	2026-08-27 03:30:31.294
cmtayt91c000fq2rgbhtf3pdj	cmtau2m370000i6b8uhyf0c4l	cmtayt91b000dq2rgcw1037jw	\N	1	220	\N	\N	sealed	Blended Scotch Whisky. Very Old Scotch Whisky aged 21 years.	2026-08-27 03:30:31.296
cmtayt91d000jq2rg5yd3odoh	cmtau2m370000i6b8uhyf0c4l	cmtayt91d000hq2rg49ztuus5	\N	1	135	\N	\N	sealed	Islay Single Malt Scotch Whisky. The Ultimate expression. Non-chill filtered.	2026-08-27 03:30:31.298
cmtaufw6u000512dhz03wmgjp	cmtau2m370000i6b8uhyf0c4l	cmtaufw6s000312dh3gjqw9tq	\N	1	295	\N	\N	sealed	\N	2026-08-27 01:28:09.654
cmtaufw6w000912dhkdln72oy	cmtau2m370000i6b8uhyf0c4l	cmtaufw6w000712dhxujs8ap8	\N	1	210	\N	\N	sealed	\N	2026-08-27 01:28:09.657
cmtaufw6z000f12dh4p7t2p8w	cmtau2m370000i6b8uhyf0c4l	cmtaufw6y000d12dhxc19keik	\N	1	235	\N	\N	sealed	\N	2026-08-27 01:28:09.659
cmtaufw71000l12dh4r7m74g2	cmtau2m370000i6b8uhyf0c4l	cmtaufw70000j12dh7yz6lubv	\N	1	210	\N	\N	sealed	\N	2026-08-27 01:28:09.661
cmtaufw73000r12dh6g07cg2m	cmtau2m370000i6b8uhyf0c4l	cmtaufw72000p12dh90fhxb7e	\N	1	175	\N	\N	sealed	\N	2026-08-27 01:28:09.663
cmtaufw75000y12dhqay8s27e	cmtau2m370000i6b8uhyf0c4l	cmtaufw74000w12dhcadi6rbo	\N	1	140	\N	\N	sealed	\N	2026-08-27 01:28:09.665
cmtaufw77001512dhq85kdxqn	cmtau2m370000i6b8uhyf0c4l	cmtaufw77001312dhivn3ox03	\N	1	165	\N	\N	sealed	\N	2026-08-27 01:28:09.668
cmtaufw79001c12dhuwmqxknb	cmtau2m370000i6b8uhyf0c4l	cmtaufw79001a12dhrouagpm4	\N	1	265	\N	\N	sealed	\N	2026-08-27 01:28:09.67
cmtaufw7b001i12dh4ovzb633	cmtau2m370000i6b8uhyf0c4l	cmtaufw7b001g12dhq7hlj8dr	\N	1	195	\N	\N	sealed	\N	2026-08-27 01:28:09.671
cmtaufw7d001o12dhzvw56aoo	cmtau2m370000i6b8uhyf0c4l	cmtaufw7d001m12dh496l2n91	\N	1	255	\N	\N	sealed	\N	2026-08-27 01:28:09.673
cmtaufw7f001u12dh20n3udyt	cmtau2m370000i6b8uhyf0c4l	cmtaufw7e001s12dhio4l65fy	\N	1	220	\N	\N	sealed	\N	2026-08-27 01:28:09.675
cmtaufw7h002012dhkqj74zdk	cmtau2m370000i6b8uhyf0c4l	cmtaufw7g001y12dhyctpai9k	\N	1	390	\N	\N	sealed	\N	2026-08-27 01:28:09.677
cmtaufw7i002612dhc3p7vm2d	cmtau2m370000i6b8uhyf0c4l	cmtaufw7i002412dhafd50ns5	\N	1	210	\N	\N	sealed	\N	2026-08-27 01:28:09.679
cmtaufw7k002c12dhtdwr15dy	cmtau2m370000i6b8uhyf0c4l	cmtaufw7j002a12dhr6c1tcsj	\N	1	225	\N	\N	sealed	\N	2026-08-27 01:28:09.68
cmtaufw7l002i12dhci5pdsgj	cmtau2m370000i6b8uhyf0c4l	cmtaufw7l002g12dh70nbq1ue	\N	1	210	\N	\N	sealed	\N	2026-08-27 01:28:09.682
cmtaufw7n002m12dhrdomhj5u	cmtau2m370000i6b8uhyf0c4l	cmtaufw7m002k12dhqy30wigw	\N	1	255	\N	\N	sealed	\N	2026-08-27 01:28:09.683
cmtaufw7o002s12dhqwpdb5ee	cmtau2m370000i6b8uhyf0c4l	cmtaufw7o002q12dhuohnuqp8	\N	1	235	\N	\N	sealed	\N	2026-08-27 01:28:09.685
cmtaufw7q002y12dh8crssbyt	cmtau2m370000i6b8uhyf0c4l	cmtaufw7p002w12dh7yhhdr02	\N	1	250	\N	\N	sealed	\N	2026-08-27 01:28:09.686
cmtaufw7r003212dhc0ix94ns	cmtau2m370000i6b8uhyf0c4l	cmtaufw7r003012dhh12pjhno	\N	1	250	\N	\N	sealed	\N	2026-08-27 01:28:09.688
cmtaufw7t003812dh71ovp9fa	cmtau2m370000i6b8uhyf0c4l	cmtaufw7s003612dh65zfgc3c	\N	1	160	\N	\N	sealed	\N	2026-08-27 01:28:09.689
cmtaufw7u003c12dhe66rhy7a	cmtau2m370000i6b8uhyf0c4l	cmtaufw7t003a12dhohxj7mwo	\N	1	175	\N	\N	sealed	\N	2026-08-27 01:28:09.69
cmtaufw7w003i12dhcs5z8lsl	cmtau2m370000i6b8uhyf0c4l	cmtaufw7w003g12dhdv6s6v8l	\N	1	175	\N	\N	sealed	\N	2026-08-27 01:28:09.693
cmtc67i460006to5azmtso7ni	cmtau2m370000i6b8uhyf0c4l	cmtc67i440004to5atlacv0pr	\N	1	\N	\N	\N	sealed	\N	2026-08-27 23:45:19.735
cmtc67i4a000bto5ant5pcoep	cmtau2m370000i6b8uhyf0c4l	cmtc67i490009to5a7122ajvu	\N	1	\N	\N	\N	sealed	\N	2026-08-27 23:45:19.739
cmtc67i4d000ito5amus765vs	cmtau2m370000i6b8uhyf0c4l	cmtc67i4c000gto5akxmek2dg	\N	1	\N	\N	\N	sealed	\N	2026-08-27 23:45:19.741
cmtc67i4f000pto5a3vv16sug	cmtau2m370000i6b8uhyf0c4l	cmtc67i4e000nto5aocxwplpu	\N	1	\N	\N	\N	sealed	\N	2026-08-27 23:45:19.743
cmtc67i4h000uto5alm79nykx	cmtau2m370000i6b8uhyf0c4l	cmtc67i4g000sto5a1fokwmch	\N	1	\N	\N	\N	sealed	\N	2026-08-27 23:45:19.745
cmtc67i4j000zto5alffuqovm	cmtau2m370000i6b8uhyf0c4l	cmtc67i4i000xto5agjpc46ic	\N	1	\N	\N	\N	sealed	\N	2026-08-27 23:45:19.747
cmtc67i4l0016to5aqtql6o9u	cmtau2m370000i6b8uhyf0c4l	cmtc67i4k0014to5a9amd86pa	\N	1	\N	\N	\N	sealed	\N	2026-08-27 23:45:19.749
cmtc67i4n001dto5atsqmnx78	cmtau2m370000i6b8uhyf0c4l	cmtc67i4n001bto5avzxb2ef1	\N	1	\N	\N	\N	sealed	\N	2026-08-27 23:45:19.752
cmtc67i4p001kto5a0snv5gon	cmtau2m370000i6b8uhyf0c4l	cmtc67i4p001ito5au3yftjui	\N	1	\N	\N	\N	sealed	\N	2026-08-27 23:45:19.754
cmtc67i4s001rto5a05z6q6wb	cmtau2m370000i6b8uhyf0c4l	cmtc67i4r001pto5a7cayfoh7	\N	1	\N	\N	\N	sealed	\N	2026-08-27 23:45:19.757
cmtc67i4v001yto5a9zd0xusy	cmtau2m370000i6b8uhyf0c4l	cmtc67i4u001wto5ao952iwgt	\N	1	\N	\N	\N	sealed	\N	2026-08-27 23:45:19.759
\.


--
-- Data for Name: ItemImage; Type: TABLE DATA; Schema: public; Owner: collection
--

COPY public."ItemImage" (id, "collectionItemId", "storageKey", "isPrimary", "createdAt") FROM stdin;
cmtau56er000113tcm3eui4pm	cmtau4k6b0003149mv3l9hrcf	cmtau2m370000i6b8uhyf0c4l/cmtau4k6b0003149mv3l9hrcf/e9fa25eb-a3e3-4da5-9a67-ff9ba364ee84_nobg.png	t	2026-08-27 01:19:49.683
cmtau581b000313tcnm2jpawg	cmtau4k6q000c149ms098n0hm	cmtau2m370000i6b8uhyf0c4l/cmtau4k6q000c149ms098n0hm/bfc7025b-39c0-4a06-b593-53a53add5258_nobg.png	t	2026-08-27 01:19:51.791
cmtau5bo1000b13tc2vnjbnjc	cmtau4k77001c149mz75cf6pd	cmtau2m370000i6b8uhyf0c4l/cmtau4k77001c149mz75cf6pd/aff0a04b-d253-4d14-8fba-dc4539d9738f_nobg.png	t	2026-08-27 01:19:56.498
cmtau5a7j000713tcdyz50jhe	cmtau4k70000u149ml1fi5lhj	cmtau2m370000i6b8uhyf0c4l/cmtau4k70000u149ml1fi5lhj/4afcef38-43af-4dcb-987d-dfc136062996_nobg.png	t	2026-08-27 01:19:54.607
cmtau5cp6000f13tcoly8w9ty	cmtau4k7d001s149mhpp4wbvg	cmtau2m370000i6b8uhyf0c4l/cmtau4k7d001s149mhpp4wbvg/ab41c2bf-fddc-4293-9ab4-841cf87b490e_nobg.png	t	2026-08-27 01:19:57.834
cmtau5dil000h13tclqa2796t	cmtau4k7g0021149mrypia701	cmtau2m370000i6b8uhyf0c4l/cmtau4k7g0021149mrypia701/9183f690-d2a1-4a5a-918f-afb7d2689682_nobg.png	t	2026-08-27 01:19:58.893
cmtau58i4000513tc4xmx7l5u	cmtau4k6x000l149m0wfa401i	cmtau2m370000i6b8uhyf0c4l/cmtau4k6x000l149m0wfa401i/ddd5a322-45e8-4f33-a563-137e954ac490_nobg.png	t	2026-08-27 01:19:52.397
cmtau5c6h000d13tc55ex6wbd	cmtau4k7a001k149mdtaz04h2	cmtau2m370000i6b8uhyf0c4l/cmtau4k79001i149mhwv0szrk/686e439d-ca27-4d00-911b-37d430260445_nobg.png	t	2026-08-27 01:19:57.162
cmtau5emt000j13tc51tuynrf	cmtau4k7j0029149mqyf08cy0	cmtau2m370000i6b8uhyf0c4l/cmtau4k7i0027149ms84jgrhi/29c86610-511d-4040-a2aa-5dd071835774_nobg.png	t	2026-08-27 01:20:00.341
cmtaulk5n0001quju67duktdt	cmtaufw6u000512dhz03wmgjp	cmtau2m370000i6b8uhyf0c4l/cmtaufw6s000312dh3gjqw9tq/aa0cf287-a5ae-46f1-b097-120f441804c8_nobg.png	t	2026-08-27 01:32:33.996
cmtaultl2000112f71zxya3zo	cmtaufw6w000912dhkdln72oy	cmtau2m370000i6b8uhyf0c4l/cmtaufw6w000712dhxujs8ap8/56a2a4b1-b504-4efe-b8bb-8b9173588eb2_nobg.png	t	2026-08-27 01:32:46.214
cmtaum1ci00019ojdroaootit	cmtaufw6z000f12dh4p7t2p8w	cmtau2m370000i6b8uhyf0c4l/cmtaufw6y000d12dhxc19keik/2342ca9e-bd3b-4ea0-ba9b-9e2f9573c963_nobg.png	t	2026-08-27 01:32:56.274
cmtaumajy0001x7ic8v9i0ydr	cmtaufw71000l12dh4r7m74g2	cmtau2m370000i6b8uhyf0c4l/cmtaufw70000j12dh7yz6lubv/93485e92-3144-492f-9499-99b083ce599f_nobg.png	t	2026-08-27 01:33:08.206
cmtaumiwz0001rgrk047xd2x0	cmtaufw73000r12dh6g07cg2m	cmtau2m370000i6b8uhyf0c4l/cmtaufw72000p12dh90fhxb7e/393d2385-445f-4cf0-aa25-3f46d0fe2feb_nobg.png	t	2026-08-27 01:33:19.043
cmtaumrll000113yxj1oxri0k	cmtaufw75000y12dhqay8s27e	cmtau2m370000i6b8uhyf0c4l/cmtaufw74000w12dhcadi6rbo/e40e9c48-4b26-4306-890c-3253114c80e0_nobg.png	t	2026-08-27 01:33:30.297
cmtaun0pf0001eq0rpjee0dw9	cmtaufw77001512dhq85kdxqn	cmtau2m370000i6b8uhyf0c4l/cmtaufw77001312dhivn3ox03/fc751c5f-dfc8-49eb-9d13-5a2551f4cffd_nobg.png	t	2026-08-27 01:33:42.099
cmtaun96o00013czspkhqvx7r	cmtaufw79001c12dhuwmqxknb	cmtau2m370000i6b8uhyf0c4l/cmtaufw79001a12dhrouagpm4/fe37b62d-be14-42eb-ba4d-341c41456226_nobg.png	t	2026-08-27 01:33:53.089
cmtauni2u0001h5kycmskcdjs	cmtaufw7b001i12dh4ovzb633	cmtau2m370000i6b8uhyf0c4l/cmtaufw7b001g12dhq7hlj8dr/e2c0eead-d634-4576-b09a-29a13af3705b_nobg.png	t	2026-08-27 01:34:04.614
cmtaunqj40001dixs035du278	cmtaufw7d001o12dhzvw56aoo	cmtau2m370000i6b8uhyf0c4l/cmtaufw7d001m12dh496l2n91/16544e97-a918-4a9e-8269-a9965c36f624_nobg.png	t	2026-08-27 01:34:15.568
cmtaunyzd000114i0jake0t4o	cmtaufw7f001u12dh20n3udyt	cmtau2m370000i6b8uhyf0c4l/cmtaufw7e001s12dhio4l65fy/a9cacabb-d270-4971-a571-7d62eb636772_nobg.png	t	2026-08-27 01:34:26.522
cmtauo8nm0001e3h6g7ddxdme	cmtaufw7h002012dhkqj74zdk	cmtau2m370000i6b8uhyf0c4l/cmtaufw7g001y12dhyctpai9k/bcf5f5f0-17bc-42f4-96b9-2fee9e7db5b9_nobg.png	t	2026-08-27 01:34:39.058
cmtauohzp0001x86x64dvov6t	cmtaufw7i002612dhc3p7vm2d	cmtau2m370000i6b8uhyf0c4l/cmtaufw7i002412dhafd50ns5/49d7ebbe-d15e-40ca-8888-5246b76a4439_nobg.png	t	2026-08-27 01:34:51.158
cmtauorkf0001koiwpodw48e0	cmtaufw7k002c12dhtdwr15dy	cmtau2m370000i6b8uhyf0c4l/cmtaufw7j002a12dhr6c1tcsj/f166bc09-0406-403d-8c87-c8b234cc2853_nobg.png	t	2026-08-27 01:35:03.567
cmtauoztc000151nlw2cdev5u	cmtaufw7l002i12dhci5pdsgj	cmtau2m370000i6b8uhyf0c4l/cmtaufw7l002g12dh70nbq1ue/fce2b324-b3da-4ac6-a220-824021c517cb_nobg.png	t	2026-08-27 01:35:14.256
cmtaup7t60001vvced2qhjwix	cmtaufw7n002m12dhrdomhj5u	cmtau2m370000i6b8uhyf0c4l/cmtaufw7m002k12dhqy30wigw/d7abf5ff-f453-45b3-8e1b-905847bcaab9_nobg.png	t	2026-08-27 01:35:24.618
cmtaupfqh0001ii0acime9i5j	cmtaufw7o002s12dhqwpdb5ee	cmtau2m370000i6b8uhyf0c4l/cmtaufw7o002q12dhuohnuqp8/94a7adff-8cc4-4bc2-b32a-2689ba897408_nobg.png	t	2026-08-27 01:35:34.889
cmtaupnym0001jd90cq39unga	cmtaufw7q002y12dh8crssbyt	cmtau2m370000i6b8uhyf0c4l/cmtaufw7p002w12dh7yhhdr02/4d8175b6-ac79-4522-aaa4-1ed48ef9cc82_nobg.png	t	2026-08-27 01:35:45.551
cmtaupvl00001stweyrp9ddq7	cmtaufw7r003212dhc0ix94ns	cmtau2m370000i6b8uhyf0c4l/cmtaufw7r003012dhh12pjhno/642dba97-8ec4-4745-af73-7a40203f87fc_nobg.png	t	2026-08-27 01:35:55.429
cmtauq5xm0001ndpxe5kvzh2u	cmtaufw7t003812dh71ovp9fa	cmtau2m370000i6b8uhyf0c4l/cmtaufw7s003612dh65zfgc3c/641cea61-1505-43d5-97cf-1470ab5c415d_nobg.png	t	2026-08-27 01:36:08.842
cmtauqe8j0001w8obzfv0ybve	cmtaufw7u003c12dhe66rhy7a	cmtau2m370000i6b8uhyf0c4l/cmtaufw7t003a12dhohxj7mwo/22e276ac-1606-41bd-8990-858531dbc966_nobg.png	t	2026-08-27 01:36:19.603
cmtauqma100012i7mrqo9fejq	cmtaufw7w003i12dhcs5z8lsl	cmtau2m370000i6b8uhyf0c4l/cmtaufw7w003g12dhdv6s6v8l/5b23922f-1f75-481d-b6c1-ba72ed06f8d8_nobg.png	t	2026-08-27 01:36:30.025
cmtayhpd20001fnmyetrihgrc	cmtaygsal0003brt6qah7pblh	cmtau2m370000i6b8uhyf0c4l/cmtaygsaj0001brt656t3t4jn/26ca0cc0-0913-42a0-baa4-618240b3c220_nobg.png	t	2026-08-27 03:21:32.583
cmtayhvzj0001nmyo1gclg4wc	cmtaygsap000abrt6th9sr7p0	cmtau2m370000i6b8uhyf0c4l/cmtaygsap0008brt6tzjkj0n4/a148e3c1-8950-4664-81a5-94d9e1325fec_nobg.png	t	2026-08-27 03:21:41.168
cmtayrtjs0001ks31a2qx9mm5	cmtayqzuj00053hc1gxcg96xy	cmtau2m370000i6b8uhyf0c4l/cmtayqzui00033hc1xpvzisbg/b265b72c-1430-4b0b-8d3a-1d1aedc4d88a_nobg.png	t	2026-08-27 03:29:24.568
cmtays1pw0001136grbjjmah6	cmtayqzuo000c3hc1x37nlm12	cmtau2m370000i6b8uhyf0c4l/cmtayqzun000a3hc1pkn1d20z/21e09066-a91f-4af5-ae35-1d0454a91d7c_nobg.png	t	2026-08-27 03:29:35.156
cmtays8h90001de4yqyry8of2	cmtayqzuq000i3hc1r6etlih2	cmtau2m370000i6b8uhyf0c4l/cmtayqzup000g3hc1o4ymke58/8684a993-6d1e-4aaa-afb0-e444450abd13_nobg.png	t	2026-08-27 03:29:43.917
cmtayu4110001ezfjts90j5v3	cmtayt9140003q2rgd5s1i94t	cmtau2m370000i6b8uhyf0c4l/cmtayt9120001q2rgv9sz1bvv/c05918ae-10ae-4cc5-8709-eb2d9ff23e4e_nobg.png	t	2026-08-27 03:31:11.461
cmtayuakd00014gbm8v2m89k7	cmtayt9170007q2rg7vg0e0fq	cmtau2m370000i6b8uhyf0c4l/cmtayt9170005q2rgu2zmjpgu/4645f1c4-d444-4795-823b-53df6b823c1e_nobg.png	t	2026-08-27 03:31:19.933
cmtayugym0001sleiq9rnbd44	cmtayt91a000bq2rgvru0569e	cmtau2m370000i6b8uhyf0c4l/cmtayt9190009q2rg0nmfjvq6/55506613-7a26-4b10-9d93-310fda7bae48_nobg.png	t	2026-08-27 03:31:28.222
cmtayuoxb00016xkxkpd64b5k	cmtayt91c000fq2rgbhtf3pdj	cmtau2m370000i6b8uhyf0c4l/cmtayt91b000dq2rgcw1037jw/9134b7a4-d227-4372-83af-0397423148a4_nobg.png	t	2026-08-27 03:31:38.543
cmtayuwds0001sr7fvo2vzm5j	cmtayt91d000jq2rg5yd3odoh	cmtau2m370000i6b8uhyf0c4l/cmtayt91d000hq2rg49ztuus5/1d78bc0c-8473-43f6-8e1a-bc3717724903_nobg.png	t	2026-08-27 03:31:48.209
cmtau5aw8000913tcv02nyzll	cmtau4k740013149mspdkkxgt	cmtau2m370000i6b8uhyf0c4l/cmtau4k730011149mfwst1dh7/ba84cf61-4896-43b5-a359-e58d2daceb3f_nobg.png	t	2026-08-27 01:19:55.496
cmtc6ft450001nvr2ydlhcp9y	cmtc67i460006to5azmtso7ni	cmtau2m370000i6b8uhyf0c4l/cmtc67i460006to5azmtso7ni/cdb47c20-4a1b-464e-b609-b75414dbc454_nobg.png	t	2026-08-27 23:51:47.237
cmtc6fvch0003nvr2u9z6je4r	cmtc67i4a000bto5ant5pcoep	cmtau2m370000i6b8uhyf0c4l/cmtc67i4a000bto5ant5pcoep/e29f8cfd-4963-41c5-aa46-166a17017f98_nobg.png	t	2026-08-27 23:51:50.13
cmtc6fxf80005nvr21f2me9jr	cmtc67i4d000ito5amus765vs	cmtau2m370000i6b8uhyf0c4l/cmtc67i4d000ito5amus765vs/c645af7d-12ca-42a6-a695-2c211e323e9c_nobg.png	t	2026-08-27 23:51:52.821
cmtc6fzbe0007nvr27yj4irgz	cmtc67i4f000pto5a3vv16sug	cmtau2m370000i6b8uhyf0c4l/cmtc67i4f000pto5a3vv16sug/b46cc79b-acbd-4bc2-a4df-aa607968e701_nobg.png	t	2026-08-27 23:51:55.274
cmtc6g17l0009nvr249jlqpvx	cmtc67i4h000uto5alm79nykx	cmtau2m370000i6b8uhyf0c4l/cmtc67i4h000uto5alm79nykx/27ce5d11-01db-4066-9113-5020fe538bb6_nobg.png	t	2026-08-27 23:51:57.729
cmtc6g332000bnvr2h519vw3y	cmtc67i4j000zto5alffuqovm	cmtau2m370000i6b8uhyf0c4l/cmtc67i4j000zto5alffuqovm/85ac95e9-8c91-4928-8dc3-48c11fb691ef_nobg.png	t	2026-08-27 23:52:00.159
cmtc6g4y2000dnvr28jjsprno	cmtc67i4l0016to5aqtql6o9u	cmtau2m370000i6b8uhyf0c4l/cmtc67i4l0016to5aqtql6o9u/37e40dc3-8291-407d-b6dd-03c0bffe2de5_nobg.png	t	2026-08-27 23:52:02.57
cmtc6g768000fnvr2r4dvyhl7	cmtc67i4n001dto5atsqmnx78	cmtau2m370000i6b8uhyf0c4l/cmtc67i4n001dto5atsqmnx78/737219a9-bb6d-4d8d-bce5-775590a73938_nobg.png	t	2026-08-27 23:52:05.456
cmtc6ga2a000hnvr250790kda	cmtc67i4p001kto5a0snv5gon	cmtau2m370000i6b8uhyf0c4l/cmtc67i4p001kto5a0snv5gon/0da6275e-7aeb-494b-a4a7-28f51ef39e05_nobg.png	t	2026-08-27 23:52:09.202
cmtc6gc1k000jnvr23kz4sehr	cmtc67i4s001rto5a05z6q6wb	cmtau2m370000i6b8uhyf0c4l/cmtc67i4s001rto5a05z6q6wb/51f05466-5ba8-4ae5-8622-5e407bf78d6b_nobg.png	t	2026-08-27 23:52:11.768
cmtc6gfmu000lnvr2l8ecrw9s	cmtc67i4v001yto5a9zd0xusy	cmtau2m370000i6b8uhyf0c4l/cmtc67i4v001yto5a9zd0xusy/70fc3bd6-bc64-4d1e-be90-63135c519675_nobg.png	t	2026-08-27 23:52:16.422
\.


--
-- Data for Name: Producer; Type: TABLE DATA; Schema: public; Owner: collection
--

COPY public."Producer" (id, name, "regionId") FROM stdin;
cmtau3fs800028phtsauyyg0n	Copper Dog Distillery	cmtau3fs600008phty01z0c45
cmtau4k6o0008149m93fm02gc	Jack Daniel Distillery	cmtau4k6j0006149mysb6i2mm
cmtau4k6v000h149ma14rgkca	North British Distillery	cmtau4k6u000f149ms5xqnbwu
cmtau4k6z000q149mkj5dz7jl	Midleton Distillery	cmtau4k6y000o149mhybs4af0
cmtau4k73000z149m0gwbyvin	Lark Distillery	cmtau4k72000x149m7povoanv
cmtau4k760018149morpfhqvx	Wild Turkey Distillery	cmtau4k750016149m480ysttk
cmtau4k79001g149m22fg2zut	GlenAllachie Distillery	cmtau3fs600008phty01z0c45
cmtau4k7c001o149mwfbq9irb	Hellyer's Road Distillery	cmtau4k72000x149m7povoanv
cmtau4k7f001x149m8hy1nfc3	Loch Lomond Distillery	cmtau4k7e001v149mnn8mnxhb
cmtau4k7i0025149ml2o89n82	Mortlach Distillery	cmtau3fs600008phty01z0c45
cmtaufw6r000112dhapm6ie37	Benrinnes Distillery	cmtau3fs600008phty01z0c45
cmtaufw6y000b12dhfcbn2sbz	Longmorn Distillery	cmtau3fs600008phty01z0c45
cmtaufw70000h12dhn8mb6r6v	Dailuaine Distillery	cmtau3fs600008phty01z0c45
cmtaufw72000n12dh78c19x09	Glen Ord Distillery	cmtau4k7e001v149mnn8mnxhb
cmtaufw74000u12dh7esqnseq	SMWS American	cmtaufw73000s12dhb0uy6xeb
cmtaufw76001112dha6kuatap	Mackmyra Distillery	cmtaufw76000z12dhqhp50wbn
cmtaufw79001812dhxlcn2fia	Bowmore Distillery	cmtaufw78001612dhhy91siyc
cmtaufw7a001e12dhntoo5lwn	Scapa Distillery	cmtau4k7e001v149mnn8mnxhb
cmtaufw7c001k12dh760cs4fx	Miltonduff Distillery	cmtau3fs600008phty01z0c45
cmtaufw7e001q12dh2q2ccaek	Ardbeg Distillery	cmtaufw78001612dhhy91siyc
cmtaufw7g001w12dh680k0sge	Glen Moray Distillery	cmtau3fs600008phty01z0c45
cmtaufw7h002212dh1qukifeg	Teaninich Distillery	cmtau4k7e001v149mnn8mnxhb
cmtaufw7j002812dh0cipmyst	Caol Ila Distillery	cmtaufw78001612dhhy91siyc
cmtaufw7k002e12dh7j9866kq	Royal Brackla Distillery	cmtau4k7e001v149mnn8mnxhb
cmtaufw7n002o12dh8itzotgx	Macduff Distillery	cmtau4k7e001v149mnn8mnxhb
cmtaufw7p002u12dh0go1xvor	Glen Grant Distillery	cmtau3fs600008phty01z0c45
cmtaufw7s003412dhd2filk2k	Bunnahabhain Distillery	cmtaufw78001612dhhy91siyc
cmtaufw7v003e12dh44xtt306	Balmenach Distillery	cmtau3fs600008phty01z0c45
cmtaygsao0006brt6dujiw5zg	Ballantine's	cmtaygsan0004brt63edn3lmk
cmtayqzuh00013hc1g77pgycy	Hidden Lake Distillery	cmtau4k72000x149m7povoanv
cmtayqzum00083hc1aty955o2	Dunville's	cmtayqzul00063hc1ihdqvq2x
cmtayqzup000e3hc1gmvx7gnw	Tomatin Distillery	cmtau4k7e001v149mnn8mnxhb
cmtc67i420002to5a1ag0w7mj	Aberlour	cmtau3fs600008phty01z0c45
cmtc67i4b000eto5amspolr9i	The Balvenie	cmtau3fs600008phty01z0c45
cmtc67i4e000lto5a8hwjcnfb	Bushmills	cmtc67i4d000jto5amqqfrvfk
cmtc67i4k0012to5andaf4wub	Loch Lomond	cmtau4k7e001v149mnn8mnxhb
cmtc67i4m0019to5a8k576fqd	Benriach	cmtau3fs600008phty01z0c45
cmtc67i4o001gto5arr7ozynx	NED Whisky	cmtc67i4n001eto5a83hv9icq
cmtc67i4r001nto5a4e9d6u2q	Westward Whiskey	cmtc67i4q001lto5azhawa09i
cmtc67i4u001uto5afjabqb7i	Teeling Whiskey	cmtc67i4t001sto5ai8ts31a2
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: collection
--

COPY public."Product" (id, name, "producerId", category, subcategory, age, abv, "caskType", description, "imageUrl", barcode, "smwsCode", "createdAt") FROM stdin;
cmtau3fs800048phtq7lwmbxp	Copper Dog	cmtau3fs800028phtsauyyg0n	whisky	blended malt	\N	40	\N	Speyside Blended Malt Scotch Whisky. 1000ml.	\N	\N	\N	2026-08-27 01:18:28.521
cmtau4k6a0001149mbcyfaexk	Copper Dog	cmtau3fs800028phtsauyyg0n	whisky	blended malt	\N	40	ex-bourbon hogshead (blended malt)	Speyside Blended Malt Scotch Whisky. 1000ml.	\N	\N	\N	2026-08-27 01:19:20.866
cmtau4k6p000a149mmvssmqgq	Jack Daniel's American Single Malt – Oloroso Sherry Cask	cmtau4k6o0008149m93fm02gc	whisky	american single malt	\N	45	Oloroso Sherry cask	Distilled 2013, Bottled 2023. 750ml.	\N	\N	\N	2026-08-27 01:19:20.882
cmtau4k6v000j149mw409i776	North British 35 Year Old	cmtau4k6v000h149ma14rgkca	whisky	single grain	35	49.8	ex-bourbon grain cask	Single Grain Scotch Whisky, 35 Years Old.	\N	\N	\N	2026-08-27 01:19:20.888
cmtau4k70000s149mcyedi9oo	Redbreast Single Pot Still 10 Year Old Distillery Edition	cmtau4k6z000q149mkj5dz7jl	whisky	single pot still	10	46	ex-bourbon + Oloroso Sherry	Irish Single Pot Still Whiskey, Ten Year Old Distillery Edition. 700ml.	\N	\N	\N	2026-08-27 01:19:20.892
cmtau4k730011149mfwst1dh7	Lark Rare Seppeltsfield II	cmtau4k73000z149m0gwbyvin	whisky	single malt	\N	46	Apera (Seppeltsfield fortified wine)	Tasmanian Single Malt Whisky, Limited Edition. 700ml.	\N	\N	\N	2026-08-27 01:19:20.896
cmtau4k76001a149mbllpwwsq	Wild Turkey Kentucky Spirit	cmtau4k760018149morpfhqvx	whisky	single barrel bourbon	\N	50.5	new charred American white oak	Kentucky Straight Bourbon Whiskey, Single Barrel. 101 Proof. 750ml.	\N	\N	\N	2026-08-27 01:19:20.899
cmtau4k79001i149mhwv0szrk	GlenAllachie Double Sherry Finish	cmtau4k79001g149m22fg2zut	whisky	single malt	\N	46	Pedro Ximénez + Oloroso Sherry finish	Whisky Club exclusive. Distilled 2013, Bottled 2023. 700ml.	\N	\N	\N	2026-08-27 01:19:20.902
cmtau4k7c001q149mdha4ys67	Hellyer's Road Vintage Triple Cask	cmtau4k7c001o149mwfbq9irb	whisky	single malt	\N	46.2	American Oak + French Oak + Port Pipe	Tasmanian Artisan Single Malt Whisky. Distilled 2014, Bottled 2016. 700ml.	\N	\N	\N	2026-08-27 01:19:20.905
cmtau4k7f001z149m61tfm65y	Loch Lomond 2010 Sauternes Cask	cmtau4k7f001x149m8hy1nfc3	whisky	single malt	\N	46	Sauternes wine cask	Single Malt Scotch Whisky. 2010 vintage. Whisky Club exclusive. 700ml.	\N	\N	\N	2026-08-27 01:19:20.908
cmtau4k7i0027149ms84jgrhi	Mortlach Special Strength 2.81 Distilled	cmtau4k7i0025149ml2o89n82	whisky	single malt	\N	49.1	ex-Sherry casks	Single Malt Scotch Whisky. Special Strength. 2.81 Distilled. 500ml.	\N	\N	\N	2026-08-27 01:19:20.911
cmtaygsaj0001brt656t3t4jn	Redbreast Single Pot Still PX Edition	cmtau4k6z000q149mkj5dz7jl	whisky	single pot still	\N	46	Pedro Ximénez hogsheads	\N	\N	\N	\N	2026-08-27 03:20:49.724
cmtaygsap0008brt6tzjkj0n4	Ballantine's 12 Year Old	cmtaygsao0006brt6dujiw5zg	whisky	blended	12	40	blended grain + malt casks	\N	\N	\N	\N	2026-08-27 03:20:49.729
cmtayqzui00033hc1xpvzisbg	Hidden Lake Single Cask White Oak Cask 910	cmtayqzuh00013hc1g77pgycy	whisky	single malt	\N	57.5	White Oak (American white oak single cask)	\N	\N	\N	\N	2026-08-27 03:28:46.075
cmtayqzun000a3hc1pkn1d20z	Dunville's The Spirit of Belfast Cigar Malt	cmtayqzum00083hc1aty955o2	whisky	single malt	\N	46.1	ex-bourbon (peated)	\N	\N	\N	\N	2026-08-27 03:28:46.079
cmtayqzup000g3hc1o4ymke58	Tomatin 14 Year Old Caribbean Rum Cask	cmtayqzup000e3hc1gmvx7gnw	whisky	single malt	14	46	Caribbean Rum cask	\N	\N	\N	\N	2026-08-27 03:28:46.082
cmtayt9170005q2rgu2zmjpgu	Ballantine's The Miltonduff 17 Year Old	cmtaygsao0006brt6dujiw5zg	whisky	single malt	17	46	ex-bourbon hogshead	\N	\N	\N	\N	2026-08-27 03:30:31.291
cmtayt9190009q2rg0nmfjvq6	Ballantine's The Glentauchers 17 Year Old	cmtaygsao0006brt6dujiw5zg	whisky	single malt	17	46	ex-bourbon hogshead	\N	\N	\N	\N	2026-08-27 03:30:31.294
cmtayt91b000dq2rgcw1037jw	Ballantine's 21 Year Old	cmtaygsao0006brt6dujiw5zg	whisky	blended	21	40	blended grain + malt casks	\N	\N	\N	\N	2026-08-27 03:30:31.295
cmtayt91d000hq2rg49ztuus5	Ardbeg Uigeadail	cmtaufw7e001q12dh2q2ccaek	whisky	single malt	\N	54.2	ex-bourbon + Oloroso Sherry butts	\N	\N	\N	\N	2026-08-27 03:30:31.297
cmtaufw6w000712dhxujs8ap8	Cobblers and Confectioners	cmtaufw6r000112dhapm6ie37	whisky	single malt	15	60.3	first fill ex-bourbon hogshead	\N	\N	\N	63.109	2026-08-27 01:28:09.656
cmtaufw6y000d12dhxc19keik	Through the Window, Brambles	cmtaufw6y000b12dhfcbn2sbz	whisky	single malt	17	58.4	ex-bourbon hogshead	\N	\N	\N	70.87	2026-08-27 01:28:09.659
cmtaufw70000j12dh7yz6lubv	A Nordic Cranachan	cmtaufw70000h12dhn8mb6r6v	whisky	single malt	15	57.8	first fill Oloroso Sherry hogshead	\N	\N	\N	71.109	2026-08-27 01:28:09.661
cmtaufw72000p12dh90fhxb7e	A Rugged Highlander	cmtaufw72000n12dh78c19x09	whisky	single malt	12	62.1	first fill ex-bourbon barrel	\N	\N	\N	78.91	2026-08-27 01:28:09.663
cmtaufw77001312dhivn3ox03	A Flashing Blade	cmtaufw76001112dha6kuatap	whisky	single malt swedish whisky	7	60.7	ex-bourbon + Swedish oak	\N	\N	\N	144.4	2026-08-27 01:28:09.667
cmtaufw79001a12dhrouagpm4	Tableques of Ash and High Kicks of Coal	cmtaufw79001812dhxlcn2fia	whisky	single malt	\N	59.3	first fill ex-bourbon hogshead	\N	\N	\N	3.184	2026-08-27 01:28:09.669
cmtaufw7b001g12dhq7hlj8dr	Black Pepper and Custard Creams	cmtaufw7a001e12dhntoo5lwn	whisky	single malt	\N	58.6	ex-bourbon hogshead	\N	\N	\N	17.28	2026-08-27 01:28:09.671
cmtaufw7d001m12dh496l2n91	Dessert Mirage	cmtaufw7c001k12dh760cs4fx	whisky	single malt	19	56.2	refill ex-bourbon hogshead	\N	\N	\N	19.74	2026-08-27 01:28:09.673
cmtaufw7g001y12dhyctpai9k	Life-Changing Magnificence	cmtaufw7g001w12dh680k0sge	whisky	single malt	27	54.8	refill ex-bourbon hogshead	\N	\N	\N	35.239	2026-08-27 01:28:09.677
cmtaufw7i002412dhafd50ns5	Pleasures Rare	cmtaufw7h002212dh1qukifeg	whisky	single malt	15	57.4	first fill ex-bourbon hogshead	\N	\N	\N	59.526	2026-08-27 01:28:09.678
cmtaufw7j002a12dhr6c1tcsj	Petals in an Orange Bitters Cocktail	cmtaufw7j002812dh0cipmyst	whisky	single malt	15	58.1	refill ex-bourbon hogshead	\N	\N	\N	53.79	2026-08-27 01:28:09.68
cmtaufw7m002k12dhqy30wigw	An Ode to Intensity	cmtaufw79001812dhxlcn2fia	whisky	single malt	17	58.3	first fill ex-bourbon hogshead	\N	\N	\N	3.347	2026-08-27 01:28:09.683
cmtaufw7o002q12dhuohnuqp8	Chewy-Textured Meanderings	cmtaufw7n002o12dh8itzotgx	whisky	single malt	17	57.6	ex-bourbon hogshead	\N	\N	\N	6.83	2026-08-27 01:28:09.684
cmtaufw7p002w12dh7yhhdr02	Melo-dram-atic	cmtaufw7p002u12dh0go1xvor	whisky	single malt	18	55.8	refill ex-bourbon hogshead	\N	\N	\N	9.66	2026-08-27 01:28:09.686
cmtaufw7r003012dhh12pjhno	Sheer Pleasure	cmtaufw7p002u12dh0go1xvor	whisky	single malt	18	57.2	first fill ex-bourbon hogshead	\N	\N	\N	9.244	2026-08-27 01:28:09.687
cmtaufw7t003a12dhohxj7mwo	Scoobie Snack	cmtaufw7s003412dhd2filk2k	whisky	single malt	11	61.5	first fill ex-bourbon hogshead	\N	\N	\N	10.273	2026-08-27 01:28:09.69
cmtaufw7w003g12dhdv6s6v8l	Fire Without Smoke	cmtaufw7v003e12dh44xtt306	whisky	single malt	11	60.9	ex-bourbon hogshead	\N	\N	\N	48.277	2026-08-27 01:28:09.692
cmtayt9120001q2rgv9sz1bvv	Lark Rare Seppeltsfield Tawny Cask	cmtau4k73000z149m0gwbyvin	whisky	single malt	\N	46	Tawny Port cask (Seppeltsfield)	\N	\N	\N	\N	2026-08-27 03:30:31.287
cmtaufw6s000312dh3gjqw9tq	Dangerously Gorgeous	cmtaufw6r000112dhapm6ie37	whisky	single malt	20	58.7	first fill Oloroso Sherry butt	\N	\N	\N	63.105	2026-08-27 01:28:09.653
cmtaufw74000w12dhcadi6rbo	Cowpuncher Rodeo Dram	cmtaufw74000u12dh7esqnseq	whisky	single malt american whisky	4	65.4	new charred American oak	\N	\N	\N	143.14	2026-08-27 01:28:09.665
cmtaufw7e001s12dhio4l65fy	An Engineer's Lunch-Box	cmtaufw7e001q12dh2q2ccaek	whisky	single malt	\N	61.4	first fill ex-bourbon hogshead	\N	\N	\N	33.124	2026-08-27 01:28:09.675
cmtaufw7l002g12dh70nbq1ue	Chocolate Crème Brûlée with Redcurrants	cmtaufw7k002e12dh7j9866kq	whisky	single malt	15	58.9	first fill Oloroso Sherry butt	\N	\N	\N	55.80	2026-08-27 01:28:09.681
cmtaufw7s003612dh65zfgc3c	Sound of Singing Sand	cmtaufw7s003412dhd2filk2k	whisky	single malt	9	63.8	first fill ex-bourbon hogshead	\N	\N	\N	10.241	2026-08-27 01:28:09.689
cmtc67i440004to5atlacv0pr	Aberlour 2010 Double Cask Limited Batch Release	cmtc67i420002to5a1ag0w7mj	whisky	single malt scotch	13	48	American Oak & Sherry Oak	\N	\N	\N	\N	2026-08-27 23:45:19.732
cmtc67i490009to5a7122ajvu	Aberlour 2012 Double Cask Limited Batch Release	cmtc67i420002to5a1ag0w7mj	whisky	single malt scotch	12	\N	American & Sherry Oak First Fill	\N	\N	\N	\N	2026-08-27 23:45:19.738
cmtc67i4c000gto5akxmek2dg	Balvenie Single Barrel First Fill 12 Year	cmtc67i4b000eto5amspolr9i	whisky	single malt scotch	12	\N	First Fill Ex-Bourbon	\N	\N	\N	\N	2026-08-27 23:45:19.74
cmtc67i4e000nto5aocxwplpu	Bushmills Causeway Collection 2012 Oloroso Sherry Cask	cmtc67i4e000lto5a8hwjcnfb	whisky	single malt irish	\N	51.6	Oloroso Sherry	\N	\N	\N	\N	2026-08-27 23:45:19.743
cmtc67i4g000sto5a1fokwmch	Bushmills Causeway Collection 2012 Burgundy Cask Finish	cmtc67i4e000lto5a8hwjcnfb	whisky	single malt irish	\N	\N	Burgundy	\N	\N	\N	\N	2026-08-27 23:45:19.745
cmtc67i4i000xto5agjpc46ic	Bushmills Causeway Collection 2010 Double Moscatel Finish	cmtc67i4e000lto5a8hwjcnfb	whisky	single malt irish	\N	\N	Oloroso & Moscatel	\N	\N	\N	\N	2026-08-27 23:45:19.747
cmtc67i4k0014to5a9amd86pa	Loch Lomond Inchmurrin 2010 Madeira Cask Finish	cmtc67i4k0012to5andaf4wub	whisky	single malt scotch	\N	47.8	Madeira	\N	\N	\N	\N	2026-08-27 23:45:19.749
cmtc67i4n001bto5avzxb2ef1	Benriach 2013 Vintage Triple Sherry Cask	cmtc67i4m0019to5a8k576fqd	whisky	single malt scotch	\N	\N	Triple Sherry (PX & Oloroso)	\N	\N	\N	\N	2026-08-27 23:45:19.751
cmtc67i4p001ito5au3yftjui	NED Australian Whisky Sour Mash	cmtc67i4o001gto5arr7ozynx	whisky	australian	\N	40	American Oak	\N	\N	\N	\N	2026-08-27 23:45:19.753
cmtc67i4r001pto5a7cayfoh7	Westward American Single Malt Lamington Porter Cask	cmtc67i4r001nto5a4e9d6u2q	whisky	american single malt	\N	50	Porter Beer Cask	\N	\N	\N	\N	2026-08-27 23:45:19.756
cmtc67i4u001wto5ao952iwgt	Teeling Small Batch Irish Whiskey	cmtc67i4u001uto5afjabqb7i	whisky	irish blended	\N	46	Rum Cask	\N	\N	\N	\N	2026-08-27 23:45:19.758
\.


--
-- Data for Name: Region; Type: TABLE DATA; Schema: public; Owner: collection
--

COPY public."Region" (id, name, country) FROM stdin;
cmtau3fs600008phty01z0c45	Speyside	Scotland
cmtau4k6j0006149mysb6i2mm	Tennessee	United States
cmtau4k6u000f149ms5xqnbwu	Lowlands	Scotland
cmtau4k6y000o149mhybs4af0	Cork	Ireland
cmtau4k72000x149m7povoanv	Tasmania	Australia
cmtau4k750016149m480ysttk	Kentucky	United States
cmtau4k7e001v149mnn8mnxhb	Highlands	Scotland
cmtaufw73000s12dhb0uy6xeb	United States	United States
cmtaufw76000z12dhqhp50wbn	Sweden	Sweden
cmtaufw78001612dhhy91siyc	Islay	Scotland
cmtaygsan0004brt63edn3lmk	Scotland	Scotland
cmtayqzul00063hc1ihdqvq2x	Belfast	Ireland
cmtc67i4d000jto5amqqfrvfk	County Antrim	Ireland
cmtc67i4n001eto5a83hv9icq	Victoria	Australia
cmtc67i4q001lto5azhawa09i	Oregon	USA
cmtc67i4t001sto5ai8ts31a2	Dublin	Ireland
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: collection
--

COPY public."User" (id, email, name, "hashedPassword", role, "createdAt") FROM stdin;
cmtau2m370000i6b8uhyf0c4l	admin@collection.local	Admin	$2a$12$DdMhiNfsXsLcbXXEJBc.qOG65HmKJaTgxUPEuIkbS9RiE3gMMkkyq	admin	2026-08-27 01:17:50.035
\.


--
-- Data for Name: Valuation; Type: TABLE DATA; Schema: public; Owner: collection
--

COPY public."Valuation" (id, "collectionItemId", value, "valuedAt", source) FROM stdin;
cmtau4k6h0005149mdc51a68j	cmtau4k6b0003149mv3l9hrcf	90	2026-08-27 01:19:20.873	retail estimate AUD
cmtau4k6r000e149mm4nmdi4t	cmtau4k6q000c149ms098n0hm	149.99	2026-08-27 01:19:20.883	retail estimate AUD
cmtau4k6x000n149mmonw4oxy	cmtau4k6x000l149m0wfa401i	195	2026-08-27 01:19:20.89	retail estimate AUD
cmtau4k71000w149mu64v7sp5	cmtau4k70000u149ml1fi5lhj	175	2026-08-27 01:19:20.894	retail estimate AUD
cmtau4k740015149mhabqnidq	cmtau4k740013149mspdkkxgt	150	2026-08-27 01:19:20.897	retail estimate AUD
cmtau4k77001e149madnf7fo7	cmtau4k77001c149mz75cf6pd	130	2026-08-27 01:19:20.9	retail estimate AUD
cmtau4k7a001m149mld0hmxmm	cmtau4k7a001k149mdtaz04h2	140	2026-08-27 01:19:20.903	retail estimate AUD
cmtau4k7d001u149mm7hny0a6	cmtau4k7d001s149mhpp4wbvg	150	2026-08-27 01:19:20.906	retail estimate AUD
cmtau4k7g0023149mde6q1r3u	cmtau4k7g0021149mrypia701	137	2026-08-27 01:19:20.909	retail estimate AUD
cmtau4k7j002b149mtzs6w9nl	cmtau4k7j0029149mqyf08cy0	138	2026-08-27 01:19:20.912	retail estimate AUD
cmtc6n7t80001uov5b775ds5b	cmtc67i460006to5azmtso7ni	145	2026-08-27 23:57:32.875	The Whisky Club (thewhiskyclub.com.au)
cmtc6n7ta0003uov5c52yv59n	cmtc67i4a000bto5ant5pcoep	140	2026-08-27 23:57:32.878	The Whisky Club (thewhiskyclub.com.au)
cmtc6n7tc0005uov5l2pvprv3	cmtc67i4d000ito5amus765vs	200	2026-08-27 23:57:32.88	Australian retail (skullandbarrel.com.au / thedrinksociety.com.au)
cmtc6n7td0007uov5a0wxcdmy	cmtc67i4f000pto5a3vv16sug	140	2026-08-27 23:57:32.881	The Whisky Club (thewhiskyclub.com.au)
cmtc6n7te0009uov5fbw5wzuw	cmtc67i4h000uto5alm79nykx	2000	2026-08-27 23:57:32.882	Secondary market auction (thewhiskyclub.com.au/journal)
cmtc6n7tf000buov5j0l4tehf	cmtc67i4j000zto5alffuqovm	140	2026-08-27 23:57:32.883	The Whisky Club (thewhiskyclub.com.au)
cmtc6n7tg000duov5l5v2pk77	cmtc67i4l0016to5aqtql6o9u	179.99	2026-08-27 23:57:32.884	Australian retail (whiskytrade.com.au)
cmtc6n7th000fuov51ms5prpd	cmtc67i4n001dto5atsqmnx78	125	2026-08-27 23:57:32.885	The Whisky Club Whisky of the Month (thewhiskyclub.com.au)
cmtc6n7ti000huov51a81gjef	cmtc67i4p001kto5a0snv5gon	62	2026-08-27 23:57:32.886	Australian retail (secretbottle.com.au)
cmtc6n7tj000juov59vhwv3dn	cmtc67i4s001rto5a05z6q6wb	208	2026-08-27 23:57:32.887	Australian retail (craftrepublic.com.au)
cmtc6n7tk000luov59voj4jce	cmtc67i4v001yto5a9zd0xusy	74.99	2026-08-27 23:57:32.888	Australian retail (barrelandbatch.com.au)
cmtc6zqb40001u3qw6ovcjb7k	cmtaygsal0003brt6qah7pblh	150	2026-08-28 00:07:16.72	The Whisky Club (thewhiskyclub.com.au)
cmtc6zqb80003u3qwu3t7m80y	cmtaygsap000abrt6th9sr7p0	55	2026-08-28 00:07:16.724	Australian retail (secretbottle.com.au)
cmtc6zqba0005u3qwxoeay4xz	cmtayqzuj00053hc1gxcg96xy	399	2026-08-28 00:07:16.726	Hidden Lake official (hiddenlake.com.au)
cmtc6zqbd0007u3qwp30q1t1a	cmtayqzuo000c3hc1x37nlm12	145	2026-08-28 00:07:16.728	The Whisky Club (thewhiskyclub.com.au)
cmtc6zqbe0009u3qw9wvkytnb	cmtayqzuq000i3hc1r6etlih2	135	2026-08-28 00:07:16.73	The Whisky Club (thewhiskyclub.com.au)
cmtc6zqbg000bu3qwzc5p49oe	cmtayt9140003q2rgd5s1i94t	150	2026-08-28 00:07:16.732	The Whisky Club (thewhiskyclub.com.au)
cmtc6zqbi000du3qwfx2zrbuz	cmtayt9170007q2rg7vg0e0fq	140	2026-08-28 00:07:16.733	The Whisky Club (thewhiskyclub.com.au)
cmtc6zqbj000fu3qwd70nj7ka	cmtayt91a000bq2rgvru0569e	199	2026-08-28 00:07:16.735	Australian retail (sessionskew.com.au / caseycellars.com.au)
cmtc6zqbk000hu3qwcv597rzo	cmtayt91c000fq2rgbhtf3pdj	214.99	2026-08-28 00:07:16.736	Australian retail (paulsliquor.com.au)
cmtc6zqbm000ju3qw8g8rlddx	cmtayt91d000jq2rg5yd3odoh	163.99	2026-08-28 00:07:16.738	Australian retail (boozehouse.com.au)
cmtc6zqbo000lu3qw444ddzlk	cmtaufw6u000512dhz03wmgjp	250	2026-08-28 00:07:16.74	SMWS Australia market estimate — Benrinnes 20yo Oloroso (smws.com.au)
cmtc6zqbq000nu3qwdj3e69e1	cmtaufw6w000912dhkdln72oy	175	2026-08-28 00:07:16.742	SMWS Australia market estimate — Benrinnes 15yo ex-bourbon (smws.com.au)
cmtc6zqbs000pu3qwqkj87vxr	cmtaufw6z000f12dh4p7t2p8w	195	2026-08-28 00:07:16.743	SMWS Australia market estimate — Longmorn 17yo ex-bourbon (smws.com.au)
cmtc6zqbt000ru3qw9vm9si7k	cmtaufw71000l12dh4r7m74g2	180	2026-08-28 00:07:16.745	SMWS Australia market estimate — Dailuaine 15yo Oloroso hogshead (smws.com.au)
cmtc6zqbu000tu3qwwj9rckjx	cmtaufw73000r12dh6g07cg2m	165	2026-08-28 00:07:16.746	SMWS Australia market estimate — Glen Ord 12yo bourbon barrel (smws.com.au)
cmtc6zqbw000vu3qweryp74g0	cmtaufw75000y12dhqay8s27e	145	2026-08-28 00:07:16.748	SMWS Australia market estimate — American single malt 4yo new oak (smws.com.au)
cmtc6zqbx000xu3qw5anpk0lf	cmtaufw77001512dhq85kdxqn	155	2026-08-28 00:07:16.749	SMWS Australia market estimate — Mackmyra 7yo ex-bourbon (smws.com.au)
cmtc6zqby000zu3qwqv0e2luu	cmtaufw79001c12dhuwmqxknb	210	2026-08-28 00:07:16.75	SMWS Australia market estimate — Bowmore first fill bourbon (smws.com.au)
cmtc6zqbz0011u3qwtm4as5d9	cmtaufw7b001i12dh4ovzb633	170	2026-08-28 00:07:16.751	SMWS Australia market estimate — Scapa ex-bourbon (smws.com.au)
cmtc6zqc00013u3qw61i2st6y	cmtaufw7d001o12dhzvw56aoo	220	2026-08-28 00:07:16.752	SMWS Australia market estimate — Miltonduff 19yo refill bourbon (smws.com.au)
cmtc6zqc20015u3qw7cb47js5	cmtaufw7f001u12dh20n3udyt	280	2026-08-28 00:07:16.753	SMWS Australia market estimate — Ardbeg first fill bourbon (smws.com.au)
cmtc6zqc30017u3qwyhks4yii	cmtaufw7h002012dhkqj74zdk	340	2026-08-28 00:07:16.755	SMWS Australia market estimate — Glen Moray 27yo refill bourbon (smws.com.au)
cmtc6zqc40019u3qw25x0453t	cmtaufw7i002612dhc3p7vm2d	165	2026-08-28 00:07:16.756	SMWS Australia market estimate — Teaninich 15yo first fill bourbon (smws.com.au)
cmtc6zqc5001bu3qwdh5k8sa0	cmtaufw7k002c12dhtdwr15dy	185	2026-08-28 00:07:16.757	SMWS Australia market estimate — Caol Ila 15yo refill bourbon (smws.com.au)
cmtc6zqc6001du3qwrjik8kpk	cmtaufw7l002i12dhci5pdsgj	195	2026-08-28 00:07:16.758	SMWS Australia market estimate — Royal Brackla 15yo Oloroso butt (smws.com.au)
cmtc6zqc7001fu3qwq37ni6xk	cmtaufw7n002m12dhrdomhj5u	245	2026-08-28 00:07:16.759	SMWS Australia market estimate — Bowmore 17yo first fill bourbon (smws.com.au)
cmtc6zqc8001hu3qw2a41dk2t	cmtaufw7o002s12dhqwpdb5ee	195	2026-08-28 00:07:16.76	SMWS Australia market estimate — Macduff 17yo ex-bourbon (smws.com.au)
cmtc6zqc9001ju3qw9afnoy3y	cmtaufw7q002y12dh8crssbyt	210	2026-08-28 00:07:16.761	SMWS Australia market estimate — Glen Grant 18yo refill bourbon (smws.com.au)
cmtc6zqca001lu3qwdi9e6gfw	cmtaufw7r003212dhc0ix94ns	210	2026-08-28 00:07:16.762	SMWS Australia market estimate — Glen Grant 18yo first fill bourbon (smws.com.au)
cmtc6zqcb001nu3qwuy2tergw	cmtaufw7t003812dh71ovp9fa	160	2026-08-28 00:07:16.763	SMWS Australia market estimate — Bunnahabhain 9yo first fill bourbon (smws.com.au)
cmtc6zqcc001pu3qwkcx0buvq	cmtaufw7u003c12dhe66rhy7a	170	2026-08-28 00:07:16.764	SMWS Australia market estimate — Bunnahabhain 11yo first fill bourbon (smws.com.au)
cmtc6zqcd001ru3qw28lgdqvx	cmtaufw7w003i12dhcs5z8lsl	160	2026-08-28 00:07:16.765	SMWS Australia market estimate — Balmenach 11yo ex-bourbon (smws.com.au)
\.


--
-- Name: CollectionItem CollectionItem_pkey; Type: CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."CollectionItem"
    ADD CONSTRAINT "CollectionItem_pkey" PRIMARY KEY (id);


--
-- Name: ItemImage ItemImage_pkey; Type: CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."ItemImage"
    ADD CONSTRAINT "ItemImage_pkey" PRIMARY KEY (id);


--
-- Name: Producer Producer_pkey; Type: CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."Producer"
    ADD CONSTRAINT "Producer_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Region Region_pkey; Type: CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."Region"
    ADD CONSTRAINT "Region_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Valuation Valuation_pkey; Type: CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."Valuation"
    ADD CONSTRAINT "Valuation_pkey" PRIMARY KEY (id);


--
-- Name: Region_name_key; Type: INDEX; Schema: public; Owner: collection
--

CREATE UNIQUE INDEX "Region_name_key" ON public."Region" USING btree (name);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: collection
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: CollectionItem CollectionItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."CollectionItem"
    ADD CONSTRAINT "CollectionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CollectionItem CollectionItem_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."CollectionItem"
    ADD CONSTRAINT "CollectionItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ItemImage ItemImage_collectionItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."ItemImage"
    ADD CONSTRAINT "ItemImage_collectionItemId_fkey" FOREIGN KEY ("collectionItemId") REFERENCES public."CollectionItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Producer Producer_regionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."Producer"
    ADD CONSTRAINT "Producer_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES public."Region"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_producerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES public."Producer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Valuation Valuation_collectionItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: collection
--

ALTER TABLE ONLY public."Valuation"
    ADD CONSTRAINT "Valuation_collectionItemId_fkey" FOREIGN KEY ("collectionItemId") REFERENCES public."CollectionItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict XTJyMB8Hl3LCDhlg4XxAHOxpmo959GmjjU4pC9aZAQsr3OvkywbbRexulD6hO64

