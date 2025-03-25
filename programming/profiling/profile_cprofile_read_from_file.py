import pstats

stats = pstats.Stats("cprofile_stats.txt")

stats.sort_stats('cumulative').print_stats(20)  # Shows top 20 functions

stats.sort_stats('time').print_stats(10)        # Top 10 by internal time
stats.sort_stats('calls').print_stats(10)       # Top 10 by call count

stats.print_callers('function_name')

stats.print_callees('function_name')

stats.sort_stats('cumulative').print_stats(.05)  # Top 5% of functions