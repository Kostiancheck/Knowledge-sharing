I have this data. I like it. I want to keep having it. But
# Horror
Missing data
https://support.google.com/drive/thread/245055606?hl=en&msgid=245724264
https://www.reddit.com/r/iCloud/comments/143cf48/lost_years_of_photos_in_icloud/
https://www.reddit.com/r/DataHoarder/comments/12lym6c/all_my_photos_in_meganz_disappeared_everything/

Services shutting down
https://www.reddit.com/r/grooveshark/comments/34go6b/grooveshark_is_shutting_down/
https://support.mozilla.org/en-US/kb/mozilla-social-faq

Vendor lock-in
https://news.ycombinator.com/item?id=27612894

Censorship
https://www.youtube.com/watch?v=JzT9clnAmY0

Digital death
https://en.wikipedia.org/wiki/List_of_lost_films
\*show The Dictator seeds vs I always wanted
# Death
If you don't do anything, the system gets destroyed automatically sooner or later. That's a fundamental feature of the universe, for some reason. It makes sense in some way, since there are way more 'unordered' states than 'ordered' states for any system.

Possible points of failure for hard drives:
- heat
- humidity
- vibrations
- mechanical damage
- magnetic damage
- electronic damage
- [cosmic rays](https://en.wikipedia.org/wiki/Soft_error#Cosmic_rays_creating_energetic_neutrons_and_protons)
- bit rot
- software errors on reads and writes

# Mediums
- HDD
- SSD
	- needs to be powered once in a while
- CD discs
	- hard to read?
	- blueray falls into the same category, as it just has smaller laser beam and more dense information
	- low density
# RAID
- RAID 0: stripes (no copies)
- RAID 1: Mirroring (exact copy)
- RAID 5: parity (one drive failure)
**RAID is not a backup!**
# Backups
3-2-1 strategy:
- 3 copies of data
- on 2 different media
- 1 copy off-site
Backup software
- [restic](https://restic.net/)
- [rclone](https://rclone.org/)
- [rsync](https://linux.die.net/man/1/rsync)
# My setup
## Hardware
+ [system](https://telemart.ua/ua/order/index/)
	+ [N100I-D](https://www.asus.com/motherboards-components/motherboards/prime/prime-n100i-d-d4/)
+ [extension card](https://rozetka.com.ua/ua/frime_ecf_pcietosataiii003_lp/p320032804/)
+ [HDD](https://hard.rozetka.com.ua/ua/wester_digital_wd120efbx/p277696468/)
\* показати фото
\* mention Synology
## Software
- OS: [TrueNAS community](https://www.truenas.com/truenas-community-edition/)
- Apps:
	- minio - blob storage
	- jellyfin - media server
	- calibre - books server
	- qbittorrent/gluetun - torrent behind VPN
	- dockge - docker containers
\*показати веб-інтерфейс
# Conclusion
It depends on who you are
layman -> don't worry, it's probably going to be okay; make 1 external backup for the most important stuff
enthusiast/advanced user -> go with Synology
linux and pc building nerd -> go DIY
# Sources
1. Entropy / What medium should be used for long term storage https://superuser.com/questions/374609/what-medium-should-be-used-for-long-term-high-volume-data-storage-archival#873260
2. Parchive https://en.wikipedia.org/wiki/Parchive
3. RAID table https://en.wikipedia.org/wiki/Standard_RAID_levels
4. 3-2-1 backup strategy https://www.backblaze.com/blog/the-3-2-1-backup-strategy/