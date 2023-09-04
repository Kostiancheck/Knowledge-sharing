-- initial (non-recursive part)
SELECT friend_a_uid, friend_b_uid, 0 as rec_depth
FROM person_1_mil_friendships
WHERE friend_a_uid = 790443 or friend_b_uid = 790443

-- friends of friends (recursive)
WITH recursive cte AS (
	SELECT friend_a_uid, friend_b_uid, 1 as rec_depth
	FROM friendship
	WHERE friend_a_uid = 790443 or friend_b_uid = 790443
	
	UNION ALL
	
	SELECT DISTINCT ON (f.friend_a_uid, f.friend_b_uid) f.friend_a_uid, f.friend_b_uid, cte.rec_depth+1 FROM cte
	JOIN friendship as f ON 
		(f.friend_a_uid = cte.friend_a_uid or f.friend_a_uid = cte.friend_b_uid
		or f.friend_b_uid = cte.friend_a_uid or f.friend_b_uid = cte.friend_b_uid) 
	WHERE cte.rec_depth + 1 <= 4
)
SELECT DISTINCT id FROM (
SELECT friend_a_uid as id FROM cte
UNION SELECT friend_b_uid as id FROM cte) as tmp
WHERE id <> 790443;