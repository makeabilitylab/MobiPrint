import re
import math
import io

def scale_rotate_gcode(input_file, scale_factor, angle, output_stream):
    print("Scaling and rotating GCode")
    layer_height = 0.3  # Fixed layer height in mm
    z_values = []  # Store Z values for each layer change
    z_movement_pattern = re.compile(r'G1 .*Z(\d*\.\d+|\d+\.\d*)')
    z_comment_pattern = re.compile(r'^;Z:(\d*\.\d+|\d+\.\d*)')
    centroid_x_pattern = re.compile(r';firstLayerCenterX = (\d*\.\d+|\d+\.?\d*)')
    centroid_y_pattern = re.compile(r';firstLayerCenterY = (\d*\.\d+|\d+\.?\d*)')

    current_z_height = 0.0
    layer_index = 0
    scaled_lines = []
    original_centroid_x = original_centroid_y = None

    angle_rad = math.radians(angle)

    # Read the original centroid coordinates
    with open(input_file, 'r') as infile:
        for line in infile:
            centroid_x_match = centroid_x_pattern.match(line)
            if centroid_x_match:
                original_centroid_x = float(centroid_x_match.group(1))
            centroid_y_match = centroid_y_pattern.match(line)
            if centroid_y_match:
                original_centroid_y = float(centroid_y_match.group(1))
            if original_centroid_x and original_centroid_y:
                break

    with open(input_file, 'r') as file:
        for line in file:
            z_match = z_movement_pattern.match(line)
            z_comment_match = z_comment_pattern.match(line)

            if z_comment_match:
                current_z_height = layer_height * layer_index * scale_factor
                scaled_lines.append(f';Z:{current_z_height:.2f}\n')
                continue

            if z_match:
                current_z_height = layer_height * layer_index * scale_factor
                new_line = re.sub(z_movement_pattern, f'G1 Z{current_z_height:.3f}', line)
                scaled_lines.append(new_line)
                continue

            if ';LAYER_CHANGE' in line:
                layer_index += 1

            if line.startswith('G1 ') and (' X' in line or ' Y' in line):
                x_match = re.search(r' X([-\d.]+)', line)
                y_match = re.search(r' Y([-\d.]+)', line)
                if x_match and y_match:
                    x_val = float(x_match.group(1))
                    y_val = float(y_match.group(1))

                    x_scaled = (x_val - original_centroid_x) * scale_factor + original_centroid_x
                    y_scaled = (y_val - original_centroid_y) * scale_factor + original_centroid_y

                    x_rotated = (x_scaled - original_centroid_x) * math.cos(angle_rad) - (y_scaled - original_centroid_y) * math.sin(angle_rad) + original_centroid_x
                    y_rotated = (x_scaled - original_centroid_x) * math.sin(angle_rad) + (y_scaled - original_centroid_y) * math.cos(angle_rad) + original_centroid_y

                    new_line = re.sub(r' X[-\d.]+', f' X{x_rotated:.3f}', line)
                    new_line = re.sub(r' Y[-\d.]+', f' Y{y_rotated:.3f}', new_line)
                    line = new_line
                    scaled_lines.append(line)
                    continue

            scaled_lines.append(line)

    # Write the scaled and rotated GCode to the provided output stream
    for line in scaled_lines:
        output_stream.write(line.encode('utf-8'))




# import re
# import math

# ### THIS APPROACH WORKS BUT NEEDS MORE TUNING

# def scale_rotate_gcode(input_file, scale_factor, angle, output_file):
#     print("Scaling and rotating GCode")
#     layer_height = 0.3  # Fixed layer height in mm
#     z_values = []  # Store Z values for each layer change
#     # Adjusted regular expression to match Z movements, including those without a digit before the decimal
#     z_movement_pattern = re.compile(r'G1 .*Z(\d*\.\d+|\d+\.\d*)')
#     z_comment_pattern = re.compile(r'^;Z:(\d*\.\d+|\d+\.\d*)')
#     centroid_x_pattern = re.compile(r';firstLayerCenterX = (\d*\.\d+|\d+\.?\d*)')
#     centroid_y_pattern = re.compile(r';firstLayerCenterY = (\d*\.\d+|\d+\.?\d*)')


#     # Variables to keep track of the adjusted Z height and layer index
#     current_z_height = 0.0
#     layer_index = 0
#     scaled_lines = []
#     original_centroid_x = original_centroid_y = None

#     angle_rad = math.radians(angle)


#     # Output file name modification
#     # output_file = input_file.replace('.gcode', f'{output_file_suffix}{scale_factor}.gcode')

#     # Calculate the new total height and the number of layers needed
#     # original_height = z_values[-1]
#     # original_num_layers = len(z_values)
#     # new_height = original_height * scale_factor
#     # num_layers = int(new_height / layer_height)

#     # Initialize counters and flags for processing
#     # current_layer = 0
#     # new_z = 0.0

#     # Read the original centroid coordinates
#     with open(input_file, 'r') as infile:
#         for line in infile:
#             centroid_x_match = centroid_x_pattern.match(line)
#             if centroid_x_match:
#                 original_centroid_x = float(centroid_x_match.group(1))
#             centroid_y_match = centroid_y_pattern.match(line)
#             if centroid_y_match:
#                 original_centroid_y = float(centroid_y_match.group(1))
#             if original_centroid_x and original_centroid_y:
#                 break

#     with open(input_file, 'r') as file: 
#         for line in file:

#             z_match = z_movement_pattern.match(line)
#             z_comment_match = z_comment_pattern.match(line)

#             #update the z value in the comment
#             if z_comment_match:
#                 # new_z = float(z_comment_match.group(1)) * scale_factor
#                 current_z_height = layer_height * layer_index * scale_factor
#                 scaled_lines.append(f';Z:{current_z_height:.2f}\n')
#                 continue
            
#             if z_match: 
#                 # Calculate the new Z height for the current layer index
#                 current_z_height = layer_height * layer_index * scale_factor
#                 # Replace the Z value in the line with the new Z height
#                 new_line = re.sub(z_movement_pattern, f'G1 Z{current_z_height:.3f}', line)
#                 scaled_lines.append(new_line)
#                 continue

#             # If the line indicates a layer change, increment the layer index
#             if ';LAYER_CHANGE' in line:
#                 layer_index += 1

#             # Check other lines for X and Y movements and scale them
#             if line.startswith('G1 ') and (' X' in line or ' Y' in line):
#                 x_match = re.search(' X([-\d.]+)', line)
#                 y_match = re.search(' Y([-\d.]+)', line)
#                 if x_match and y_match:
#                     x_val = float(x_match.group(1))
#                     y_val = float(y_match.group(1))

#                     # Scale
#                     x_scaled = (x_val - original_centroid_x) * scale_factor + original_centroid_x
#                     y_scaled = (y_val - original_centroid_y) * scale_factor + original_centroid_y
                    
#                     # Rotate
#                     x_rotated = (x_scaled - original_centroid_x) * math.cos(angle_rad) - (y_scaled - original_centroid_y) * math.sin(angle_rad) + original_centroid_x
#                     y_rotated = (x_scaled - original_centroid_x) * math.sin(angle_rad) + (y_scaled - original_centroid_y) * math.cos(angle_rad) + original_centroid_y
                    
#                     # Replace in line
#                     new_line = re.sub(' X[-\d.]+', f' X{x_rotated:.3f}', line)
#                     new_line = re.sub(' Y[-\d.]+', f' Y{y_rotated:.3f}', new_line)
#                     line = new_line
#                     scaled_lines.append(line)
#                     continue

#             # Append non-XYZ movement lines directly to the output list
#             if not z_match and not (line.startswith('G1 ') and (' X' in line or ' Y' in line)):
#                 scaled_lines.append(line)

        
#     with open(output_file, 'w') as outfile:
#         outfile.writelines(scaled_lines)