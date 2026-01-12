SELECT setval('article_id_seq', (SELECT MAX(id) FROM article));
SELECT setval('article_tag_id_seq', (SELECT MAX(id) FROM article_tag));
SELECT setval('photo_id_seq', (SELECT MAX(id) FROM photo));
SELECT setval('photo_album_id_seq', (SELECT MAX(id) FROM photo_album));
SELECT setval('statistic_id_seq', (SELECT MAX(id) FROM statistic));
SELECT setval('system_setting_id_seq', (SELECT MAX(id) FROM system_setting));
SELECT setval('user_id_seq', (SELECT MAX(id) FROM "user"));
SELECT setval('user_info_id_seq', (SELECT MAX(id) FROM user_info));
